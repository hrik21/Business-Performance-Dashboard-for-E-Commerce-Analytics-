/**
 * ETL Pipeline Service for batch data processing
 */

import { EventEmitter } from 'events';
import { DataConnector, DataConnectorResult } from './data-connector.service';
import { DataValidationService } from './data-validation.service';
import { sequelize } from '../models';
import { Transaction } from 'sequelize';

export interface ETLJobConfig {
  id: string;
  name: string;
  description?: string;
  source: {
    dataSourceId: string;
    query: string | object;
    batchSize?: number;
  };
  transformations: TransformationStep[];
  destination: {
    table: string;
    mode: 'insert' | 'upsert' | 'replace';
    keyColumns?: string[];
  };
  schedule?: {
    enabled: boolean;
    cron?: string;
    interval?: number; // in milliseconds
  };
  validation?: {
    enabled: boolean;
    rules: ValidationRule[];
    onFailure: 'skip' | 'stop' | 'quarantine';
  };
}

export interface TransformationStep {
  type: 'map' | 'filter' | 'aggregate' | 'join' | 'custom';
  config: any;
  description?: string;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
  config: any;
  message?: string;
}

export interface ETLJobResult {
  jobId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  recordsFailed: number;
  errors: string[];
  warnings: string[];
}

export interface ETLJobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  currentStep?: string;
  startTime?: Date;
  estimatedCompletion?: Date;
}

export class ETLPipelineService extends EventEmitter {
  private jobs: Map<string, ETLJobConfig> = new Map();
  private runningJobs: Map<string, ETLJobStatus> = new Map();
  private jobHistory: Map<string, ETLJobResult[]> = new Map();
  private dataConnector: DataConnector;
  private validationService: DataValidationService;
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor(dataConnector: DataConnector) {
    super();
    this.dataConnector = dataConnector;
    this.validationService = new DataValidationService();
  }

  /**
   * Register an ETL job configuration
   */
  registerJob(config: ETLJobConfig): void {
    this.jobs.set(config.id, config);
    
    // Set up scheduling if enabled
    if (config.schedule?.enabled) {
      this.scheduleJob(config);
    }

    this.emit('jobRegistered', config.id);
  }

  /**
   * Execute an ETL job
   */
  async executeJob(jobId: string): Promise<ETLJobResult> {
    const config = this.jobs.get(jobId);
    if (!config) {
      throw new Error(`ETL job ${jobId} not found`);
    }

    // Check if job is already running
    if (this.runningJobs.has(jobId)) {
      throw new Error(`ETL job ${jobId} is already running`);
    }

    const startTime = new Date();
    const jobStatus: ETLJobStatus = {
      jobId,
      status: 'running',
      progress: 0,
      currentStep: 'Initializing',
      startTime,
    };

    this.runningJobs.set(jobId, jobStatus);
    this.emit('jobStarted', jobStatus);

    let transaction: Transaction | null = null;

    try {
      // Start database transaction
      transaction = await sequelize.transaction();

      // Extract data
      jobStatus.currentStep = 'Extracting data';
      jobStatus.progress = 10;
      this.emit('jobProgress', jobStatus);

      const extractResult = await this.extractData(config);
      if (!extractResult.success || !extractResult.data) {
        throw new Error(`Data extraction failed: ${extractResult.error}`);
      }

      let processedData = extractResult.data;
      let recordsProcessed = processedData.length;

      // Transform data
      jobStatus.currentStep = 'Transforming data';
      jobStatus.progress = 30;
      this.emit('jobProgress', jobStatus);

      processedData = await this.transformData(processedData, config.transformations);

      // Validate data
      let recordsSkipped = 0;
      let recordsFailed = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      if (config.validation?.enabled) {
        jobStatus.currentStep = 'Validating data';
        jobStatus.progress = 60;
        this.emit('jobProgress', jobStatus);

        const validationResult = await this.validateData(
          processedData, 
          config.validation.rules,
          config.validation.onFailure
        );

        processedData = validationResult.validData;
        recordsSkipped = validationResult.skippedCount;
        recordsFailed = validationResult.failedCount;
        errors.push(...validationResult.errors);
        warnings.push(...validationResult.warnings);
      }

      // Load data
      jobStatus.currentStep = 'Loading data';
      jobStatus.progress = 80;
      this.emit('jobProgress', jobStatus);

      const loadResult = await this.loadData(processedData, config.destination, transaction);

      // Commit transaction
      await transaction.commit();
      transaction = null;

      // Complete job
      const endTime = new Date();
      jobStatus.status = 'completed';
      jobStatus.progress = 100;
      jobStatus.currentStep = 'Completed';

      const result: ETLJobResult = {
        jobId,
        success: true,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        recordsProcessed,
        recordsInserted: loadResult.inserted,
        recordsUpdated: loadResult.updated,
        recordsSkipped,
        recordsFailed,
        errors,
        warnings,
      };

      // Store result in history
      if (!this.jobHistory.has(jobId)) {
        this.jobHistory.set(jobId, []);
      }
      this.jobHistory.get(jobId)!.push(result);

      this.runningJobs.delete(jobId);
      this.emit('jobCompleted', result);

      return result;

    } catch (error) {
      // Rollback transaction if it exists
      if (transaction) {
        await transaction.rollback();
      }

      const endTime = new Date();
      jobStatus.status = 'failed';

      const result: ETLJobResult = {
        jobId,
        success: false,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
      };

      // Store result in history
      if (!this.jobHistory.has(jobId)) {
        this.jobHistory.set(jobId, []);
      }
      this.jobHistory.get(jobId)!.push(result);

      this.runningJobs.delete(jobId);
      this.emit('jobFailed', result);

      throw error;
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): ETLJobStatus | null {
    return this.runningJobs.get(jobId) || null;
  }

  /**
   * Get job history
   */
  getJobHistory(jobId: string, limit: number = 10): ETLJobResult[] {
    const history = this.jobHistory.get(jobId) || [];
    return history.slice(-limit);
  }

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const jobStatus = this.runningJobs.get(jobId);
    if (!jobStatus) {
      return false;
    }

    jobStatus.status = 'cancelled';
    this.runningJobs.delete(jobId);
    this.emit('jobCancelled', jobId);

    return true;
  }

  /**
   * Get all registered jobs
   */
  getJobs(): ETLJobConfig[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Remove a job configuration
   */
  removeJob(jobId: string): boolean {
    // Cancel if running
    this.cancelJob(jobId);

    // Remove scheduled job
    const scheduledJob = this.scheduledJobs.get(jobId);
    if (scheduledJob) {
      clearInterval(scheduledJob);
      this.scheduledJobs.delete(jobId);
    }

    // Remove configuration
    const removed = this.jobs.delete(jobId);
    if (removed) {
      this.emit('jobRemoved', jobId);
    }

    return removed;
  }

  // Private methods

  private async extractData(config: ETLJobConfig): Promise<DataConnectorResult> {
    const batchSize = config.source.batchSize || 1000;
    
    return await this.dataConnector.extractData(
      config.source.dataSourceId,
      config.source.query,
      { limit: batchSize }
    );
  }

  private async transformData(data: any[], transformations: TransformationStep[]): Promise<any[]> {
    let result = data;

    for (const transformation of transformations) {
      switch (transformation.type) {
        case 'map':
          result = this.applyMapTransformation(result, transformation.config);
          break;
        case 'filter':
          result = this.applyFilterTransformation(result, transformation.config);
          break;
        case 'aggregate':
          result = this.applyAggregateTransformation(result, transformation.config);
          break;
        case 'custom':
          result = await this.applyCustomTransformation(result, transformation.config);
          break;
        default:
          console.warn(`Unknown transformation type: ${transformation.type}`);
      }
    }

    return result;
  }

  private applyMapTransformation(data: any[], config: any): any[] {
    return data.map(record => {
      const mapped: any = {};
      
      for (const [targetField, sourceField] of Object.entries(config.mapping)) {
        if (typeof sourceField === 'string') {
          mapped[targetField] = record[sourceField];
        } else if (typeof sourceField === 'function') {
          mapped[targetField] = sourceField(record);
        }
      }

      return mapped;
    });
  }

  private applyFilterTransformation(data: any[], config: any): any[] {
    return data.filter(record => {
      for (const condition of config.conditions) {
        const value = record[condition.field];
        
        switch (condition.operator) {
          case 'equals':
            if (value !== condition.value) return false;
            break;
          case 'not_equals':
            if (value === condition.value) return false;
            break;
          case 'greater_than':
            if (value <= condition.value) return false;
            break;
          case 'less_than':
            if (value >= condition.value) return false;
            break;
          case 'contains':
            if (!String(value).includes(condition.value)) return false;
            break;
          case 'not_null':
            if (value == null) return false;
            break;
        }
      }
      
      return true;
    });
  }

  private applyAggregateTransformation(data: any[], config: any): any[] {
    const grouped = new Map<string, any[]>();
    
    // Group by specified fields
    for (const record of data) {
      const groupKey = config.groupBy.map((field: string) => record[field]).join('|');
      
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      
      grouped.get(groupKey)!.push(record);
    }

    // Apply aggregations
    const result: any[] = [];
    
    for (const [groupKey, records] of grouped) {
      const aggregated: any = {};
      
      // Add group by fields
      config.groupBy.forEach((field: string, index: number) => {
        aggregated[field] = groupKey.split('|')[index];
      });

      // Apply aggregation functions
      for (const [targetField, aggregation] of Object.entries(config.aggregations)) {
        const agg = aggregation as any;
        const values = records.map(r => r[agg.field]).filter(v => v != null);
        
        switch (agg.function) {
          case 'sum':
            aggregated[targetField] = values.reduce((sum, val) => sum + Number(val), 0);
            break;
          case 'avg':
            aggregated[targetField] = values.reduce((sum, val) => sum + Number(val), 0) / values.length;
            break;
          case 'count':
            aggregated[targetField] = values.length;
            break;
          case 'min':
            aggregated[targetField] = Math.min(...values.map(Number));
            break;
          case 'max':
            aggregated[targetField] = Math.max(...values.map(Number));
            break;
        }
      }

      result.push(aggregated);
    }

    return result;
  }

  private async applyCustomTransformation(data: any[], config: any): Promise<any[]> {
    // For custom transformations, config should contain a function
    if (typeof config.transform === 'function') {
      return await config.transform(data);
    }
    
    return data;
  }

  private async validateData(
    data: any[], 
    rules: ValidationRule[], 
    onFailure: 'skip' | 'stop' | 'quarantine'
  ): Promise<{
    validData: any[];
    skippedCount: number;
    failedCount: number;
    errors: string[];
    warnings: string[];
  }> {
    const validData: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let skippedCount = 0;
    let failedCount = 0;

    for (const record of data) {
      const validationResult = await this.validationService.validateRecord(record, rules);
      
      if (validationResult.isValid) {
        validData.push(record);
      } else {
        switch (onFailure) {
          case 'skip':
            skippedCount++;
            warnings.push(`Record skipped: ${validationResult.errors.join(', ')}`);
            break;
          case 'stop':
            errors.push(`Validation failed: ${validationResult.errors.join(', ')}`);
            throw new Error(`Data validation failed: ${validationResult.errors.join(', ')}`);
          case 'quarantine':
            failedCount++;
            // In a real implementation, quarantined records would be stored separately
            warnings.push(`Record quarantined: ${validationResult.errors.join(', ')}`);
            break;
        }
      }
    }

    return {
      validData,
      skippedCount,
      failedCount,
      errors,
      warnings,
    };
  }

  private async loadData(
    data: any[], 
    destination: ETLJobConfig['destination'], 
    transaction: Transaction
  ): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    // This is a simplified implementation
    // In a real scenario, you would use the appropriate Sequelize model
    const tableName = destination.table;

    switch (destination.mode) {
      case 'insert':
        for (const record of data) {
          await sequelize.query(
            `INSERT INTO ${tableName} (${Object.keys(record).join(', ')}) VALUES (${Object.keys(record).map(() => '?').join(', ')})`,
            {
              replacements: Object.values(record),
              transaction,
            }
          );
          inserted++;
        }
        break;

      case 'upsert':
        // Simplified upsert logic
        for (const record of data) {
          const keyColumns = destination.keyColumns || ['id'];
          const whereClause = keyColumns.map(col => `${col} = ?`).join(' AND ');
          const keyValues = keyColumns.map(col => record[col]);

          const [existing] = await sequelize.query(
            `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`,
            {
              replacements: keyValues,
              transaction,
            }
          ) as any[];

          if (existing[0].count > 0) {
            // Update
            const setClause = Object.keys(record).map(col => `${col} = ?`).join(', ');
            await sequelize.query(
              `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`,
              {
                replacements: [...Object.values(record), ...keyValues],
                transaction,
              }
            );
            updated++;
          } else {
            // Insert
            await sequelize.query(
              `INSERT INTO ${tableName} (${Object.keys(record).join(', ')}) VALUES (${Object.keys(record).map(() => '?').join(', ')})`,
              {
                replacements: Object.values(record),
                transaction,
              }
            );
            inserted++;
          }
        }
        break;

      case 'replace':
        // Delete all existing data and insert new data
        await sequelize.query(`DELETE FROM ${tableName}`, { transaction });
        
        for (const record of data) {
          await sequelize.query(
            `INSERT INTO ${tableName} (${Object.keys(record).join(', ')}) VALUES (${Object.keys(record).map(() => '?').join(', ')})`,
            {
              replacements: Object.values(record),
              transaction,
            }
          );
          inserted++;
        }
        break;
    }

    return { inserted, updated };
  }

  private scheduleJob(config: ETLJobConfig): void {
    if (!config.schedule?.enabled) {
      return;
    }

    if (config.schedule.interval) {
      const intervalId = setInterval(async () => {
        try {
          await this.executeJob(config.id);
        } catch (error) {
          console.error(`Scheduled job ${config.id} failed:`, error);
        }
      }, config.schedule.interval);

      this.scheduledJobs.set(config.id, intervalId);
    }

    // For cron scheduling, you would integrate with a cron library like node-cron
  }
}
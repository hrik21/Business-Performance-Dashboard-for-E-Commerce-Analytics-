/**
 * Stream Processor Service for real-time data transformation
 */

import { EventEmitter } from 'events';
import { Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { createConsumer, getProducer, createTopic } from '../config/kafka';
import { DataValidationService, ValidationRule } from './data-validation.service';
import { ErrorHandlerService } from './error-handler.service';

export interface StreamProcessorConfig {
  id: string;
  name: string;
  description?: string;
  inputTopic: string;
  outputTopic?: string;
  consumerGroupId: string;
  processingRules: ProcessingRule[];
  validation?: {
    enabled: boolean;
    rules: ValidationRule[];
    onFailure: 'skip' | 'deadletter' | 'retry';
  };
  errorHandling?: {
    deadLetterTopic?: string;
    maxRetries?: number;
    retryDelay?: number;
  };
  batchProcessing?: {
    enabled: boolean;
    batchSize: number;
    batchTimeout: number; // in milliseconds
  };
}

export interface ProcessingRule {
  type: 'transform' | 'filter' | 'enrich' | 'aggregate' | 'custom';
  config: any;
  description?: string;
}

export interface StreamMessage {
  key?: string;
  value: any;
  headers?: Record<string, string>;
  timestamp?: Date;
  partition?: number;
  offset?: string;
}

export interface ProcessingResult {
  success: boolean;
  originalMessage: StreamMessage;
  processedMessage?: StreamMessage;
  error?: string;
  metadata?: {
    processingTime: number;
    rulesApplied: string[];
  };
}

export interface StreamProcessorStats {
  messagesProcessed: number;
  messagesSuccessful: number;
  messagesFailed: number;
  averageProcessingTime: number;
  throughputPerSecond: number;
  lastProcessedAt?: Date;
  uptime: number;
}

export class StreamProcessor extends EventEmitter {
  private config: StreamProcessorConfig;
  private consumer: Consumer | null = null;
  private producer: Producer | null = null;
  private validationService: DataValidationService;
  private errorHandler: ErrorHandlerService;
  private isRunning: boolean = false;
  private stats: StreamProcessorStats;
  private startTime: Date;
  private batchBuffer: StreamMessage[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(config: StreamProcessorConfig) {
    super();
    this.config = config;
    this.validationService = new DataValidationService();
    this.errorHandler = new ErrorHandlerService();
    this.startTime = new Date();
    this.stats = {
      messagesProcessed: 0,
      messagesSuccessful: 0,
      messagesFailed: 0,
      averageProcessingTime: 0,
      throughputPerSecond: 0,
      uptime: 0,
    };
  }

  /**
   * Start the stream processor
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error(`Stream processor ${this.config.id} is already running`);
    }

    try {
      // Create consumer
      this.consumer = await createConsumer(this.config.consumerGroupId);
      
      // Create producer if output topic is specified
      if (this.config.outputTopic) {
        this.producer = await getProducer();
      }

      // Create topics if they don't exist
      await this.ensureTopicsExist();

      // Subscribe to input topic
      await this.consumer.subscribe({
        topic: this.config.inputTopic,
        fromBeginning: false,
      });

      // Start consuming messages
      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this),
      });

      this.isRunning = true;
      this.startTime = new Date();
      
      this.emit('started', { processorId: this.config.id });
      console.log(`Stream processor ${this.config.id} started successfully`);

    } catch (error) {
      this.emit('error', {
        processorId: this.config.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Stop the stream processor
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Process any remaining batched messages
      if (this.batchBuffer.length > 0) {
        await this.processBatch();
      }

      // Clear batch timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }

      // Disconnect consumer
      if (this.consumer) {
        await this.consumer.disconnect();
        this.consumer = null;
      }

      this.isRunning = false;
      
      this.emit('stopped', { processorId: this.config.id });
      console.log(`Stream processor ${this.config.id} stopped successfully`);

    } catch (error) {
      this.emit('error', {
        processorId: this.config.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get processor statistics
   */
  getStats(): StreamProcessorStats {
    const now = new Date();
    const uptimeMs = now.getTime() - this.startTime.getTime();
    
    return {
      ...this.stats,
      uptime: Math.floor(uptimeMs / 1000),
      throughputPerSecond: this.stats.messagesProcessed / (uptimeMs / 1000) || 0,
    };
  }

  /**
   * Update processor configuration
   */
  updateConfig(newConfig: Partial<StreamProcessorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', { processorId: this.config.id, config: this.config });
  }

  /**
   * Check if processor is running
   */
  isProcessorRunning(): boolean {
    return this.isRunning;
  }

  // Private methods

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const startTime = Date.now();
    
    try {
      const message: StreamMessage = {
        key: payload.message.key?.toString(),
        value: JSON.parse(payload.message.value?.toString() || '{}'),
        headers: this.parseHeaders(payload.message.headers),
        timestamp: payload.message.timestamp ? new Date(parseInt(payload.message.timestamp)) : new Date(),
        partition: payload.partition,
        offset: payload.message.offset,
      };

      // Handle batch processing
      if (this.config.batchProcessing?.enabled) {
        await this.handleBatchMessage(message);
        return;
      }

      // Process single message
      const result = await this.processMessage(message);
      
      // Update statistics
      this.updateStats(result, Date.now() - startTime);

      // Emit processing result
      this.emit('messageProcessed', result);

    } catch (error) {
      const result: ProcessingResult = {
        success: false,
        originalMessage: {
          key: payload.message.key?.toString(),
          value: payload.message.value?.toString(),
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.updateStats(result, Date.now() - startTime);
      this.emit('messageProcessed', result);
      this.emit('processingError', result);
    }
  }

  private async handleBatchMessage(message: StreamMessage): Promise<void> {
    this.batchBuffer.push(message);

    // Check if batch is full
    if (this.batchBuffer.length >= (this.config.batchProcessing?.batchSize || 100)) {
      await this.processBatch();
      return;
    }

    // Set timer for batch timeout if not already set
    if (!this.batchTimer && this.config.batchProcessing?.batchTimeout) {
      this.batchTimer = setTimeout(async () => {
        await this.processBatch();
      }, this.config.batchProcessing.batchTimeout);
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batchBuffer.length === 0) {
      return;
    }

    const batch = [...this.batchBuffer];
    this.batchBuffer = [];

    // Clear timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const startTime = Date.now();
    const results: ProcessingResult[] = [];

    // Process all messages in batch
    for (const message of batch) {
      const result = await this.processMessage(message);
      results.push(result);
    }

    // Update statistics
    const processingTime = Date.now() - startTime;
    results.forEach(result => this.updateStats(result, processingTime / batch.length));

    // Emit batch processing result
    this.emit('batchProcessed', {
      processorId: this.config.id,
      batchSize: batch.length,
      results,
      processingTime,
    });
  }

  private async processMessage(message: StreamMessage): Promise<ProcessingResult> {
    const startTime = Date.now();
    const rulesApplied: string[] = [];

    try {
      let processedData = message.value;

      // Apply validation if enabled
      if (this.config.validation?.enabled) {
        const validationResult = await this.validationService.validateRecord(
          processedData,
          this.config.validation.rules
        );

        if (!validationResult.isValid) {
          return await this.handleValidationFailure(message, validationResult.errors);
        }

        if (validationResult.cleanedData) {
          processedData = validationResult.cleanedData;
        }
      }

      // Apply processing rules
      for (const rule of this.config.processingRules) {
        processedData = await this.applyProcessingRule(processedData, rule);
        rulesApplied.push(rule.type);
      }

      const processedMessage: StreamMessage = {
        ...message,
        value: processedData,
        timestamp: new Date(),
      };

      // Send to output topic if specified
      if (this.config.outputTopic && this.producer) {
        await this.producer.send({
          topic: this.config.outputTopic,
          messages: [{
            key: processedMessage.key,
            value: JSON.stringify(processedMessage.value),
            headers: processedMessage.headers,
          }],
        });
      }

      return {
        success: true,
        originalMessage: message,
        processedMessage,
        metadata: {
          processingTime: Date.now() - startTime,
          rulesApplied,
        },
      };

    } catch (error) {
      return {
        success: false,
        originalMessage: message,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          processingTime: Date.now() - startTime,
          rulesApplied,
        },
      };
    }
  }

  private async applyProcessingRule(data: any, rule: ProcessingRule): Promise<any> {
    switch (rule.type) {
      case 'transform':
        return this.applyTransformRule(data, rule.config);
      case 'filter':
        return this.applyFilterRule(data, rule.config);
      case 'enrich':
        return await this.applyEnrichRule(data, rule.config);
      case 'aggregate':
        return this.applyAggregateRule(data, rule.config);
      case 'custom':
        return await this.applyCustomRule(data, rule.config);
      default:
        return data;
    }
  }

  private applyTransformRule(data: any, config: any): any {
    const transformed = { ...data };
    
    if (config.fieldMappings) {
      for (const [targetField, sourceField] of Object.entries(config.fieldMappings)) {
        if (typeof sourceField === 'string') {
          transformed[targetField] = data[sourceField];
        } else if (typeof sourceField === 'function') {
          transformed[targetField] = sourceField(data);
        }
      }
    }

    if (config.calculations) {
      for (const [field, calculation] of Object.entries(config.calculations)) {
        const calc = calculation as any;
        switch (calc.type) {
          case 'sum':
            transformed[field] = calc.fields.reduce((sum: number, f: string) => sum + (data[f] || 0), 0);
            break;
          case 'multiply':
            transformed[field] = calc.fields.reduce((product: number, f: string) => product * (data[f] || 1), 1);
            break;
          case 'concat':
            transformed[field] = calc.fields.map((f: string) => data[f] || '').join(calc.separator || '');
            break;
        }
      }
    }

    return transformed;
  }

  private applyFilterRule(data: any, config: any): any {
    // For stream processing, filter rules typically don't modify data
    // but could be used to determine if message should be processed further
    return data;
  }

  private async applyEnrichRule(data: any, config: any): Promise<any> {
    const enriched = { ...data };
    
    // Add timestamp if requested
    if (config.addTimestamp) {
      enriched.processedAt = new Date().toISOString();
    }

    // Add processor metadata
    if (config.addMetadata) {
      enriched._metadata = {
        processorId: this.config.id,
        processorName: this.config.name,
        processedAt: new Date().toISOString(),
      };
    }

    // External enrichment (e.g., lookup from database or API)
    if (config.externalLookup) {
      // This would typically involve calling an external service
      // For now, we'll just add a placeholder
      enriched._enriched = true;
    }

    return enriched;
  }

  private applyAggregateRule(data: any, config: any): any {
    // For stream processing, aggregation typically requires state management
    // This is a simplified implementation
    return data;
  }

  private async applyCustomRule(data: any, config: any): Promise<any> {
    if (typeof config.processor === 'function') {
      return await config.processor(data);
    }
    return data;
  }

  private async handleValidationFailure(
    message: StreamMessage, 
    errors: string[]
  ): Promise<ProcessingResult> {
    const failure = this.config.validation?.onFailure || 'skip';

    switch (failure) {
      case 'skip':
        return {
          success: false,
          originalMessage: message,
          error: `Validation failed: ${errors.join(', ')}`,
        };

      case 'deadletter':
        if (this.config.errorHandling?.deadLetterTopic && this.producer) {
          await this.producer.send({
            topic: this.config.errorHandling.deadLetterTopic,
            messages: [{
              key: message.key,
              value: JSON.stringify({
                originalMessage: message,
                errors,
                timestamp: new Date().toISOString(),
              }),
            }],
          });
        }
        return {
          success: false,
          originalMessage: message,
          error: `Validation failed, sent to dead letter: ${errors.join(', ')}`,
        };

      case 'retry':
        // Implement retry logic here
        return {
          success: false,
          originalMessage: message,
          error: `Validation failed, retry needed: ${errors.join(', ')}`,
        };

      default:
        return {
          success: false,
          originalMessage: message,
          error: `Validation failed: ${errors.join(', ')}`,
        };
    }
  }

  private parseHeaders(headers: any): Record<string, string> {
    const parsed: Record<string, string> = {};
    
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        parsed[key] = value?.toString() || '';
      }
    }

    return parsed;
  }

  private updateStats(result: ProcessingResult, processingTime: number): void {
    this.stats.messagesProcessed++;
    
    if (result.success) {
      this.stats.messagesSuccessful++;
    } else {
      this.stats.messagesFailed++;
    }

    // Update average processing time
    const totalTime = this.stats.averageProcessingTime * (this.stats.messagesProcessed - 1) + processingTime;
    this.stats.averageProcessingTime = totalTime / this.stats.messagesProcessed;
    
    this.stats.lastProcessedAt = new Date();
  }

  private async ensureTopicsExist(): Promise<void> {
    const topicsToCreate = [this.config.inputTopic];
    
    if (this.config.outputTopic) {
      topicsToCreate.push(this.config.outputTopic);
    }
    
    if (this.config.errorHandling?.deadLetterTopic) {
      topicsToCreate.push(this.config.errorHandling.deadLetterTopic);
    }

    for (const topic of topicsToCreate) {
      await createTopic({
        topic,
        numPartitions: 3,
        replicationFactor: 1,
      });
    }
  }
}
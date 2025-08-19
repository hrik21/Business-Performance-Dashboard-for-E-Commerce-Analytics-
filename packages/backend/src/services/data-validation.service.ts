/**
 * Data Validation and Cleansing Service
 */

import Joi from 'joi';

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'range' | 'pattern' | 'custom' | 'enum' | 'length';
  config: any;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedData?: any;
}

export interface DataQualityReport {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  validationRate: number;
  fieldQuality: Record<string, {
    nullCount: number;
    nullRate: number;
    uniqueCount: number;
    duplicateCount: number;
    validCount: number;
    invalidCount: number;
  }>;
  commonErrors: Array<{
    error: string;
    count: number;
    percentage: number;
  }>;
}

export class DataValidationService {
  private customValidators: Map<string, (value: any, config: any) => boolean> = new Map();
  private cleansingRules: Map<string, (value: any) => any> = new Map();

  constructor() {
    this.initializeDefaultCleansingRules();
  }

  /**
   * Register a custom validator function
   */
  registerCustomValidator(name: string, validator: (value: any, config: any) => boolean): void {
    this.customValidators.set(name, validator);
  }

  /**
   * Register a custom cleansing rule
   */
  registerCleansingRule(name: string, cleanser: (value: any) => any): void {
    this.cleansingRules.set(name, cleanser);
  }

  /**
   * Validate a single record against validation rules
   */
  async validateRecord(record: any, rules: ValidationRule[]): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const cleanedData = { ...record };

    for (const rule of rules) {
      const value = record[rule.field];
      const validationResult = await this.validateField(value, rule);

      if (!validationResult.isValid) {
        errors.push(...validationResult.errors);
      }

      if (validationResult.warnings.length > 0) {
        warnings.push(...validationResult.warnings);
      }

      // Apply cleansing if available
      if (validationResult.cleanedData !== undefined) {
        cleanedData[rule.field] = validationResult.cleanedData;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedData: errors.length === 0 ? cleanedData : undefined,
    };
  }

  /**
   * Validate multiple records and generate a data quality report
   */
  async validateDataset(
    data: any[], 
    rules: ValidationRule[]
  ): Promise<{
    results: ValidationResult[];
    qualityReport: DataQualityReport;
  }> {
    const results: ValidationResult[] = [];
    const fieldStats: Record<string, any> = {};
    const errorCounts: Record<string, number> = {};

    // Initialize field statistics
    const allFields = new Set<string>();
    data.forEach(record => {
      Object.keys(record).forEach(field => allFields.add(field));
    });

    allFields.forEach(field => {
      fieldStats[field] = {
        nullCount: 0,
        values: new Set(),
        validCount: 0,
        invalidCount: 0,
      };
    });

    // Validate each record
    for (const record of data) {
      const result = await this.validateRecord(record, rules);
      results.push(result);

      // Update field statistics
      Object.keys(record).forEach(field => {
        const value = record[field];
        
        if (value == null) {
          fieldStats[field].nullCount++;
        } else {
          fieldStats[field].values.add(value);
        }

        if (result.isValid) {
          fieldStats[field].validCount++;
        } else {
          fieldStats[field].invalidCount++;
        }
      });

      // Count errors
      result.errors.forEach(error => {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      });
    }

    // Generate quality report
    const totalRecords = data.length;
    const validRecords = results.filter(r => r.isValid).length;
    const invalidRecords = totalRecords - validRecords;

    const fieldQuality: Record<string, any> = {};
    Object.keys(fieldStats).forEach(field => {
      const stats = fieldStats[field];
      fieldQuality[field] = {
        nullCount: stats.nullCount,
        nullRate: stats.nullCount / totalRecords,
        uniqueCount: stats.values.size,
        duplicateCount: totalRecords - stats.nullCount - stats.values.size,
        validCount: stats.validCount,
        invalidCount: stats.invalidCount,
      };
    });

    const commonErrors = Object.entries(errorCounts)
      .map(([error, count]) => ({
        error,
        count,
        percentage: (count / totalRecords) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const qualityReport: DataQualityReport = {
      totalRecords,
      validRecords,
      invalidRecords,
      validationRate: (validRecords / totalRecords) * 100,
      fieldQuality,
      commonErrors,
    };

    return { results, qualityReport };
  }

  /**
   * Clean and standardize data
   */
  cleanseData(data: any[], cleansingRules: string[] = []): any[] {
    return data.map(record => {
      const cleaned = { ...record };

      Object.keys(cleaned).forEach(field => {
        let value = cleaned[field];

        // Apply default cleansing to all fields
        value = this.applyDefaultCleansing(value);

        // Apply custom cleansing rules only to specified fields
        cleansingRules.forEach(ruleName => {
          const cleanser = this.cleansingRules.get(ruleName);
          if (cleanser) {
            // Check if this rule should apply to this field
            if (this.shouldApplyCleansingRule(ruleName, field)) {
              value = cleanser(value);
            }
          }
        });

        cleaned[field] = value;
      });

      return cleaned;
    });
  }

  /**
   * Detect data anomalies and outliers
   */
  detectAnomalies(data: any[], field: string): {
    outliers: any[];
    anomalies: any[];
    statistics: {
      mean: number;
      median: number;
      standardDeviation: number;
      min: number;
      max: number;
      q1: number;
      q3: number;
      iqr: number;
    };
  } {
    const values = data
      .map(record => record[field])
      .filter(value => typeof value === 'number' && !isNaN(value))
      .sort((a, b) => a - b);

    if (values.length === 0) {
      return {
        outliers: [],
        anomalies: [],
        statistics: {
          mean: 0, median: 0, standardDeviation: 0,
          min: 0, max: 0, q1: 0, q3: 0, iqr: 0
        }
      };
    }

    // Calculate statistics
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = values[Math.floor(values.length / 2)];
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    const min = values[0];
    const max = values[values.length - 1];
    
    const q1Index = Math.floor(values.length * 0.25);
    const q3Index = Math.floor(values.length * 0.75);
    const q1 = values[q1Index];
    const q3 = values[q3Index];
    const iqr = q3 - q1;

    // Detect outliers using IQR method
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = data.filter(record => {
      const value = record[field];
      return typeof value === 'number' && (value < lowerBound || value > upperBound);
    });

    // Detect anomalies using z-score method
    const anomalies = data.filter(record => {
      const value = record[field];
      if (typeof value !== 'number') return false;
      const zScore = Math.abs((value - mean) / standardDeviation);
      return zScore > 3; // Values more than 3 standard deviations from mean
    });

    return {
      outliers,
      anomalies,
      statistics: {
        mean, median, standardDeviation, min, max, q1, q3, iqr
      }
    };
  }

  // Private methods

  private async validateField(value: any, rule: ValidationRule): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let cleanedData: any = undefined;

    try {
      switch (rule.type) {
        case 'required':
          if (value == null || value === '') {
            errors.push(rule.message || `Field ${rule.field} is required`);
          }
          break;

        case 'type':
          const expectedType = rule.config.type;
          const actualType = typeof value;
          
          if (value != null && actualType !== expectedType) {
            // Try to convert if possible
            if (expectedType === 'number' && !isNaN(Number(value))) {
              cleanedData = Number(value);
              warnings.push(`Field ${rule.field} converted from ${actualType} to number`);
            } else if (expectedType === 'string') {
              cleanedData = String(value);
              warnings.push(`Field ${rule.field} converted to string`);
            } else {
              errors.push(rule.message || `Field ${rule.field} must be of type ${expectedType}, got ${actualType}`);
            }
          }
          break;

        case 'range':
          if (typeof value === 'number') {
            if (rule.config.min !== undefined && value < rule.config.min) {
              errors.push(rule.message || `Field ${rule.field} must be at least ${rule.config.min}`);
            }
            if (rule.config.max !== undefined && value > rule.config.max) {
              errors.push(rule.message || `Field ${rule.field} must be at most ${rule.config.max}`);
            }
          }
          break;

        case 'pattern':
          if (typeof value === 'string') {
            const pattern = new RegExp(rule.config.pattern);
            if (!pattern.test(value)) {
              errors.push(rule.message || `Field ${rule.field} does not match required pattern`);
            }
          }
          break;

        case 'enum':
          if (!rule.config.values.includes(value)) {
            errors.push(rule.message || `Field ${rule.field} must be one of: ${rule.config.values.join(', ')}`);
          }
          break;

        case 'length':
          if (typeof value === 'string') {
            if (rule.config.min !== undefined && value.length < rule.config.min) {
              errors.push(rule.message || `Field ${rule.field} must be at least ${rule.config.min} characters`);
            }
            if (rule.config.max !== undefined && value.length > rule.config.max) {
              errors.push(rule.message || `Field ${rule.field} must be at most ${rule.config.max} characters`);
            }
          }
          break;

        case 'custom':
          const validator = this.customValidators.get(rule.config.validator);
          if (validator) {
            const isValid = validator(value, rule.config);
            if (!isValid) {
              errors.push(rule.message || `Field ${rule.field} failed custom validation`);
            }
          } else {
            errors.push(`Custom validator ${rule.config.validator} not found`);
          }
          break;
      }
    } catch (error) {
      errors.push(`Validation error for field ${rule.field}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedData,
    };
  }

  private applyDefaultCleansing(value: any): any {
    if (typeof value === 'string') {
      // Trim whitespace
      value = value.trim();
      
      // Remove extra spaces
      value = value.replace(/\s+/g, ' ');
      
      // Don't convert empty strings to null in default cleansing
      // Let validation rules handle empty string validation
    }

    return value;
  }

  private shouldApplyCleansingRule(ruleName: string, fieldName: string): boolean {
    // Map cleansing rules to field patterns
    const ruleFieldMap: Record<string, string[]> = {
      'email': ['email', 'mail', 'e_mail'],
      'phone': ['phone', 'telephone', 'mobile', 'tel'],
      'currency': ['price', 'cost', 'amount', 'value', 'currency'],
      'date': ['date', 'time', 'created', 'updated', 'modified'],
    };

    const fieldPatterns = ruleFieldMap[ruleName] || [];
    const lowerFieldName = fieldName.toLowerCase();
    
    return fieldPatterns.some(pattern => lowerFieldName.includes(pattern));
  }

  private initializeDefaultCleansingRules(): void {
    // Email cleansing
    this.registerCleansingRule('email', (value: any) => {
      if (typeof value === 'string') {
        return value.toLowerCase().trim();
      }
      return value;
    });

    // Phone number cleansing
    this.registerCleansingRule('phone', (value: any) => {
      if (typeof value === 'string') {
        return value.replace(/[^\d+]/g, '');
      }
      return value;
    });

    // Currency cleansing
    this.registerCleansingRule('currency', (value: any) => {
      if (typeof value === 'string') {
        const cleaned = value.replace(/[$,\s]/g, '');
        const number = parseFloat(cleaned);
        return isNaN(number) ? value : number;
      }
      return value;
    });

    // Date standardization
    this.registerCleansingRule('date', (value: any) => {
      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toISOString();
      }
      return value;
    });
  }
}
/**
 * Data Ingestion Services Unit Tests
 */

import { DataConnector, DataSourceConfig } from '../services/data-connector.service';
import { ETLPipelineService, ETLJobConfig } from '../services/etl-pipeline.service';
import { DataValidationService, ValidationRule } from '../services/data-validation.service';
import { ErrorHandlerService } from '../services/error-handler.service';

describe('Data Ingestion Services', () => {
  describe('DataConnector', () => {
    let dataConnector: DataConnector;

    beforeEach(() => {
      dataConnector = new DataConnector();
    });

    afterEach(async () => {
      await dataConnector.closeAllConnections();
    });

    it('should register a file data source', async () => {
      const config: DataSourceConfig = {
        id: 'test-file',
        name: 'Test File Source',
        type: 'file',
        config: {
          path: '/tmp/test.csv',
          format: 'csv',
          hasHeader: true,
          delimiter: ',',
        },
      };

      await expect(dataConnector.registerDataSource(config)).resolves.not.toThrow();
      
      const status = dataConnector.getConnectionStatus();
      expect(status['test-file']).toBeDefined();
      expect(status['test-file'].type).toBe('file');
      expect(status['test-file'].name).toBe('Test File Source');
    });

    it('should register an API data source', async () => {
      const config: DataSourceConfig = {
        id: 'test-api',
        name: 'Test API Source',
        type: 'api',
        config: {
          baseUrl: 'https://api.example.com',
          endpoints: {
            data: '/data',
          },
          timeout: 5000,
        },
        credentials: {
          apiKey: 'test-key',
        },
      };

      await expect(dataConnector.registerDataSource(config)).resolves.not.toThrow();
      
      const status = dataConnector.getConnectionStatus();
      expect(status['test-api']).toBeDefined();
      expect(status['test-api'].type).toBe('api');
    });

    it('should handle unsupported data source types', async () => {
      const config = {
        id: 'test-unsupported',
        name: 'Unsupported Source',
        type: 'unsupported' as any,
        config: {
          path: '/tmp/test',
          format: 'json' as any,
        },
      };

      await expect(dataConnector.registerDataSource(config)).rejects.toThrow('Unsupported data source type');
    });

    it('should emit events during data source registration', async () => {
      const config: DataSourceConfig = {
        id: 'test-events',
        name: 'Test Events Source',
        type: 'file',
        config: {
          path: '/tmp/test.json',
          format: 'json',
        },
      };

      const registeredSpy = jest.fn();
      dataConnector.on('dataSourceRegistered', registeredSpy);

      await dataConnector.registerDataSource(config);

      expect(registeredSpy).toHaveBeenCalledWith('test-events');
    });
  });

  describe('DataValidationService', () => {
    let validationService: DataValidationService;

    beforeEach(() => {
      validationService = new DataValidationService();
    });

    it('should validate required fields', async () => {
      const record = { name: 'John', age: null };
      const rules: ValidationRule[] = [
        {
          field: 'name',
          type: 'required',
          config: {},
        },
        {
          field: 'age',
          type: 'required',
          config: {},
        },
      ];

      const result = await validationService.validateRecord(record, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('age');
      expect(result.errors[0]).toContain('required');
    });

    it('should validate data types with conversion', async () => {
      const record = { price: '123.45', quantity: '10' };
      const rules: ValidationRule[] = [
        {
          field: 'price',
          type: 'type',
          config: { type: 'number' },
        },
        {
          field: 'quantity',
          type: 'type',
          config: { type: 'number' },
        },
      ];

      const result = await validationService.validateRecord(record, rules);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(2);
      expect(result.cleanedData?.price).toBe(123.45);
      expect(result.cleanedData?.quantity).toBe(10);
    });

    it('should validate ranges', async () => {
      const record = { score: 150, rating: -1 };
      const rules: ValidationRule[] = [
        {
          field: 'score',
          type: 'range',
          config: { min: 0, max: 100 },
        },
        {
          field: 'rating',
          type: 'range',
          config: { min: 0, max: 5 },
        },
      ];

      const result = await validationService.validateRecord(record, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it('should validate patterns', async () => {
      const record = { email: 'invalid-email', phone: '123-456-7890' };
      const rules: ValidationRule[] = [
        {
          field: 'email',
          type: 'pattern',
          config: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        },
        {
          field: 'phone',
          type: 'pattern',
          config: { pattern: '^\\d{3}-\\d{3}-\\d{4}$' },
        },
      ];

      const result = await validationService.validateRecord(record, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('email');
    });

    it('should validate enum values', async () => {
      const record = { status: 'invalid', priority: 'high' };
      const rules: ValidationRule[] = [
        {
          field: 'status',
          type: 'enum',
          config: { values: ['active', 'inactive', 'pending'] },
        },
        {
          field: 'priority',
          type: 'enum',
          config: { values: ['low', 'medium', 'high'] },
        },
      ];

      const result = await validationService.validateRecord(record, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('status');
    });

    it('should register and use custom validators', async () => {
      validationService.registerCustomValidator('even', (value: any) => {
        return typeof value === 'number' && value % 2 === 0;
      });

      const record = { evenNumber: 7 };
      const rules: ValidationRule[] = [
        {
          field: 'evenNumber',
          type: 'custom',
          config: { validator: 'even' },
        },
      ];

      const result = await validationService.validateRecord(record, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should generate data quality report', async () => {
      const data = [
        { name: 'John', age: 25, email: 'john@example.com' },
        { name: '', age: null, email: 'invalid-email' },
        { name: 'Jane', age: 30, email: 'jane@example.com' },
      ];

      const rules: ValidationRule[] = [
        { field: 'name', type: 'required', config: {} },
        { field: 'age', type: 'required', config: {} },
        { field: 'email', type: 'pattern', config: { pattern: '^[^@]+@[^@]+\\.[^@]+$' } },
      ];

      const { qualityReport } = await validationService.validateDataset(data, rules);

      expect(qualityReport.totalRecords).toBe(3);
      expect(qualityReport.validRecords).toBe(2); // John and Jane are valid
      expect(qualityReport.invalidRecords).toBe(1); // Only the middle record is invalid
      expect(qualityReport.validationRate).toBeCloseTo(66.67, 1);
      expect(qualityReport.fieldQuality.name.nullCount).toBe(0); // Empty string is not null in this context
      expect(qualityReport.fieldQuality.age.nullCount).toBe(1);
    });

    it('should cleanse data', () => {
      const data = [
        { name: '  John Doe  ', email: 'JOHN@EXAMPLE.COM', phone: '(123) 456-7890' },
        { name: 'Jane   Smith', email: 'jane@EXAMPLE.com', phone: '987-654-3210' },
      ];

      const cleansed = validationService.cleanseData(data, ['email', 'phone']);

      // Default cleansing applies to all fields (trimming and space normalization)
      expect(cleansed[0].name).toBe('John Doe');
      expect(cleansed[0].email).toBe('john@example.com'); // email rule applied
      expect(cleansed[0].phone).toBe('1234567890'); // phone rule applied
      expect(cleansed[1].name).toBe('Jane Smith');
    });

    it('should detect anomalies and outliers', () => {
      const data = [
        { value: 10 }, { value: 12 }, { value: 11 }, { value: 13 },
        { value: 9 }, { value: 14 }, { value: 100 }, { value: 8 },
      ];

      const result = validationService.detectAnomalies(data, 'value');

      expect(result.outliers.length).toBeGreaterThan(0);
      expect(result.statistics.mean).toBeGreaterThan(0);
      expect(result.statistics.standardDeviation).toBeGreaterThan(0);
    });
  });

  describe('ErrorHandlerService', () => {
    let errorHandler: ErrorHandlerService;

    beforeEach(() => {
      errorHandler = new ErrorHandlerService();
    });

    it('should execute operation with retry on retryable error', async () => {
      let attempts = 0;
      const operation = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('Connection refused');
          (error as any).code = 'ECONNREFUSED';
          throw error;
        }
        return Promise.resolve('success');
      });

      const result = await errorHandler.executeWithRetry('database', operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable error', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Validation failed'));

      await expect(
        errorHandler.executeWithRetry('database', operation)
      ).rejects.toThrow('Validation failed');

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max retry limit', async () => {
      const operation = jest.fn().mockImplementation(() => {
        const error = new Error('Connection refused');
        (error as any).code = 'ECONNREFUSED';
        throw error;
      });

      await expect(
        errorHandler.executeWithRetry('database', operation, {
          maxRetries: 2,
          initialDelay: 10,
          maxDelay: 100,
          backoffMultiplier: 2,
          retryableErrors: ['ECONNREFUSED'],
        })
      ).rejects.toThrow('Connection refused');

      expect(operation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should track error statistics', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Test error'));

      try {
        await errorHandler.executeWithRetry('test-operation', operation, {
          maxRetries: 1,
          initialDelay: 10,
          maxDelay: 100,
          backoffMultiplier: 2,
          retryableErrors: ['Test error'],
        });
      } catch (error) {
        // Expected to fail
      }

      const stats = errorHandler.getErrorStats('test-operation');
      expect(stats.count).toBe(2); // 1 initial + 1 retry
      expect(stats.lastOccurrence).toBeInstanceOf(Date);
    });

    it('should create standardized error responses', () => {
      const error = new Error('Test error');
      (error as any).code = 'TEST_ERROR';

      const response = errorHandler.createErrorResponse(error, { operation: 'test' });

      expect(response.success).toBe(false);
      expect(response.error.code).toBe('TEST_ERROR');
      expect(response.error.message).toBe('Test error');
      expect(response.error.context).toEqual({ operation: 'test' });
      expect(response.error.timestamp).toBeDefined();
    });

    it('should emit events during retry process', async () => {
      const operationFailedSpy = jest.fn();
      const retryAttemptSpy = jest.fn();
      const maxRetriesReachedSpy = jest.fn();

      errorHandler.on('operationFailed', operationFailedSpy);
      errorHandler.on('retryAttempt', retryAttemptSpy);
      errorHandler.on('maxRetriesReached', maxRetriesReachedSpy);

      const operation = jest.fn().mockImplementation(() => {
        const error = new Error('Connection refused');
        (error as any).code = 'ECONNREFUSED';
        throw error;
      });

      try {
        await errorHandler.executeWithRetry('database', operation, {
          maxRetries: 2,
          initialDelay: 10,
          maxDelay: 100,
          backoffMultiplier: 2,
          retryableErrors: ['ECONNREFUSED'],
        });
      } catch (error) {
        // Expected to fail
      }

      expect(operationFailedSpy).toHaveBeenCalledTimes(3);
      expect(retryAttemptSpy).toHaveBeenCalledTimes(2);
      expect(maxRetriesReachedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('ETLPipelineService Integration', () => {
    let dataConnector: DataConnector;
    let etlService: ETLPipelineService;

    beforeEach(() => {
      dataConnector = new DataConnector();
      etlService = new ETLPipelineService(dataConnector);
    });

    afterEach(async () => {
      await dataConnector.closeAllConnections();
    });

    it('should register ETL job configuration', () => {
      const config: ETLJobConfig = {
        id: 'test-job',
        name: 'Test ETL Job',
        source: {
          dataSourceId: 'test-source',
          query: 'SELECT * FROM test_table',
        },
        transformations: [],
        destination: {
          table: 'target_table',
          mode: 'insert',
        },
      };

      etlService.registerJob(config);

      const jobs = etlService.getJobs();
      expect(jobs).toHaveLength(1);
      expect(jobs[0].id).toBe('test-job');
    });

    it('should prevent duplicate job execution', async () => {
      const config: ETLJobConfig = {
        id: 'test-job',
        name: 'Test ETL Job',
        source: {
          dataSourceId: 'test-source',
          query: 'SELECT * FROM test_table',
        },
        transformations: [],
        destination: {
          table: 'target_table',
          mode: 'insert',
        },
      };

      etlService.registerJob(config);

      // Mock a long-running job
      const longRunningOperation = () => new Promise(resolve => setTimeout(resolve, 1000));
      
      // Start first execution
      const promise1 = etlService.executeJob('test-job').catch(() => {});
      
      // Try to start second execution immediately
      await expect(etlService.executeJob('test-job')).rejects.toThrow('already running');
      
      // Wait for first execution to complete
      await promise1;
    });

    it('should track job history', async () => {
      const config: ETLJobConfig = {
        id: 'history-test',
        name: 'History Test Job',
        source: {
          dataSourceId: 'test-source',
          query: 'SELECT * FROM test_table',
        },
        transformations: [],
        destination: {
          table: 'target_table',
          mode: 'insert',
        },
      };

      etlService.registerJob(config);

      // Mock the data connector to return test data
      jest.spyOn(dataConnector, 'extractData').mockResolvedValue({
        success: false,
        error: 'Test error',
        metadata: { recordCount: 0, executionTime: 100, source: 'test-source' },
      });

      try {
        await etlService.executeJob('history-test');
      } catch (error) {
        // Expected to fail
      }

      const history = etlService.getJobHistory('history-test');
      expect(history).toHaveLength(1);
      expect(history[0].success).toBe(false);
      expect(history[0].jobId).toBe('history-test');
    });
  });
});
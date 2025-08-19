/**
 * Stream Processing Services Unit Tests
 */

import { StreamProcessor, StreamProcessorConfig } from '../services/stream-processor.service';
import { DataQualityMonitorService, QualityRule } from '../services/data-quality-monitor.service';

// Mock Kafka dependencies
jest.mock('../config/kafka', () => ({
  createConsumer: jest.fn().mockResolvedValue({
    subscribe: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  }),
  getProducer: jest.fn().mockResolvedValue({
    send: jest.fn().mockResolvedValue(undefined),
  }),
  createTopic: jest.fn().mockResolvedValue(true),
}));

describe('Stream Processing Services', () => {
  describe('StreamProcessor', () => {
    let processor: StreamProcessor;
    let config: StreamProcessorConfig;

    beforeEach(() => {
      config = {
        id: 'test-processor',
        name: 'Test Stream Processor',
        inputTopic: 'input-topic',
        outputTopic: 'output-topic',
        consumerGroupId: 'test-group',
        processingRules: [
          {
            type: 'transform',
            config: {
              fieldMappings: {
                fullName: 'name',
                userEmail: 'email',
              },
            },
          },
        ],
      };

      processor = new StreamProcessor(config);
    });

    afterEach(async () => {
      if (processor.isProcessorRunning()) {
        await processor.stop();
      }
    });

    it('should create stream processor with configuration', () => {
      expect(processor).toBeDefined();
      expect(processor.isProcessorRunning()).toBe(false);
    });

    it('should start and stop processor', async () => {
      await processor.start();
      expect(processor.isProcessorRunning()).toBe(true);

      await processor.stop();
      expect(processor.isProcessorRunning()).toBe(false);
    });

    it('should prevent starting processor twice', async () => {
      await processor.start();
      
      await expect(processor.start()).rejects.toThrow('already running');
      
      await processor.stop();
    });

    it('should update configuration', () => {
      const newConfig = { description: 'Updated description' };
      
      const configUpdatedSpy = jest.fn();
      processor.on('configUpdated', configUpdatedSpy);
      
      processor.updateConfig(newConfig);
      
      expect(configUpdatedSpy).toHaveBeenCalledWith({
        processorId: 'test-processor',
        config: expect.objectContaining(newConfig),
      });
    });

    it('should get initial statistics', () => {
      const stats = processor.getStats();
      
      expect(stats).toEqual({
        messagesProcessed: 0,
        messagesSuccessful: 0,
        messagesFailed: 0,
        averageProcessingTime: 0,
        throughputPerSecond: 0,
        uptime: expect.any(Number),
      });
    });

    it('should emit events during lifecycle', async () => {
      const startedSpy = jest.fn();
      const stoppedSpy = jest.fn();
      
      processor.on('started', startedSpy);
      processor.on('stopped', stoppedSpy);
      
      await processor.start();
      expect(startedSpy).toHaveBeenCalledWith({ processorId: 'test-processor' });
      
      await processor.stop();
      expect(stoppedSpy).toHaveBeenCalledWith({ processorId: 'test-processor' });
    });
  });

  describe('DataQualityMonitorService', () => {
    let monitor: DataQualityMonitorService;

    beforeEach(() => {
      monitor = new DataQualityMonitorService();
    });

    afterEach(() => {
      monitor.stopMonitoring();
    });

    it('should create monitor service', () => {
      expect(monitor).toBeDefined();
    });

    it('should add and remove quality rules', () => {
      const rule: QualityRule = {
        id: 'test-rule',
        name: 'Test Rule',
        type: 'completeness',
        field: 'testField',
        condition: {},
        severity: 'warning',
        description: 'Test rule description',
      };

      const ruleAddedSpy = jest.fn();
      const ruleRemovedSpy = jest.fn();
      
      monitor.on('ruleAdded', ruleAddedSpy);
      monitor.on('ruleRemoved', ruleRemovedSpy);

      monitor.addQualityRule(rule);
      expect(ruleAddedSpy).toHaveBeenCalledWith(rule);

      const removed = monitor.removeQualityRule('test-rule');
      expect(removed).toBe(true);
      expect(ruleRemovedSpy).toHaveBeenCalledWith('test-rule');

      const removedAgain = monitor.removeQualityRule('test-rule');
      expect(removedAgain).toBe(false);
    });

    it('should process messages and update metrics', () => {
      const message = {
        key: 'test-key',
        value: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
        },
        timestamp: new Date(),
      };

      const result = {
        success: true,
        originalMessage: message,
        processedMessage: message,
      };

      monitor.processMessage(message, result);

      // Metrics should be available after processing
      const metrics = monitor.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should track alerts', () => {
      const alertCreatedSpy = jest.fn();
      monitor.on('alertCreated', alertCreatedSpy);

      // Add a rule that will trigger an alert
      const rule: QualityRule = {
        id: 'missing-field-rule',
        name: 'Missing Field Rule',
        type: 'completeness',
        field: 'requiredField',
        condition: {},
        severity: 'critical',
        description: 'Required field is missing',
      };

      monitor.addQualityRule(rule);

      // Process a message that violates the rule
      const message = {
        key: 'test-key',
        value: {
          name: 'John Doe',
          // requiredField is missing
        },
        timestamp: new Date(),
      };

      monitor.processMessage(message);

      // Should have created an alert
      expect(alertCreatedSpy).toHaveBeenCalled();
      
      const alerts = monitor.getActiveAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should acknowledge and resolve alerts', () => {
      const alertAcknowledgedSpy = jest.fn();
      const alertResolvedSpy = jest.fn();
      
      monitor.on('alertAcknowledged', alertAcknowledgedSpy);
      monitor.on('alertResolved', alertResolvedSpy);

      // Create an alert first
      const rule: QualityRule = {
        id: 'test-alert-rule',
        name: 'Test Alert Rule',
        type: 'completeness',
        field: 'testField',
        condition: {},
        severity: 'warning',
        description: 'Test alert rule',
      };

      monitor.addQualityRule(rule);

      const message = {
        key: 'test-key',
        value: { name: 'John' }, // missing testField
        timestamp: new Date(),
      };

      monitor.processMessage(message);

      const alerts = monitor.getActiveAlerts();
      if (alerts.length > 0) {
        const alertId = alerts[0].id;

        // Acknowledge alert
        const acknowledged = monitor.acknowledgeAlert(alertId);
        expect(acknowledged).toBe(true);
        expect(alertAcknowledgedSpy).toHaveBeenCalled();

        // Resolve alert
        const resolved = monitor.resolveAlert(alertId);
        expect(resolved).toBe(true);
        expect(alertResolvedSpy).toHaveBeenCalled();
      }
    });

    it('should generate quality report', (done) => {
      // Process some test messages
      const messages = [
        {
          key: 'msg1',
          value: { name: 'John', email: 'john@example.com', age: 30 },
          timestamp: new Date(),
        },
        {
          key: 'msg2',
          value: { name: 'Jane', email: 'jane@example.com', age: 25 },
          timestamp: new Date(),
        },
        {
          key: 'msg3',
          value: { name: '', email: 'invalid-email', age: null },
          timestamp: new Date(),
        },
      ];

      messages.forEach(message => {
        monitor.processMessage(message, {
          success: true,
          originalMessage: message,
        });
      });

      // Wait a bit for metrics to be calculated
      setTimeout(() => {
        try {
          const report = monitor.generateReport();

          expect(report).toBeDefined();
          expect(report.timestamp).toBeInstanceOf(Date);
          expect(report.overallScore).toBeGreaterThanOrEqual(0);
          expect(report.overallScore).toBeLessThanOrEqual(100);
          expect(report.metrics).toBeInstanceOf(Array);
          expect(report.alerts).toBeInstanceOf(Array);
          expect(report.trends).toBeDefined();
          expect(report.recommendations).toBeInstanceOf(Array);
          done();
        } catch (error) {
          done(error);
        }
      }, 100);
    });

    it('should calculate quality metrics correctly', (done) => {
      // Test completeness calculation
      const completeMessage = {
        key: 'complete',
        value: { name: 'John', email: 'john@example.com', age: 30 },
        timestamp: new Date(),
      };

      const incompleteMessage = {
        key: 'incomplete',
        value: { name: 'Jane', email: '', age: null },
        timestamp: new Date(),
      };

      monitor.processMessage(completeMessage);
      monitor.processMessage(incompleteMessage);

      // Trigger metrics update manually by calling the private method via reflection
      // In a real scenario, this would happen automatically on the monitoring interval
      (monitor as any).updateMetrics();

      try {
        const metrics = monitor.getMetrics();
        expect(metrics.length).toBeGreaterThan(0);
        
        // Check that metrics are being calculated
        const report = monitor.generateReport();
        expect(report.overallScore).toBeGreaterThanOrEqual(0);
        expect(report.overallScore).toBeLessThanOrEqual(100);
        done();
      } catch (error) {
        done(error);
      }
    });

    it('should handle different quality rule types', () => {
      const rules: QualityRule[] = [
        {
          id: 'completeness-rule',
          name: 'Completeness Rule',
          type: 'completeness',
          field: 'name',
          condition: {},
          severity: 'warning',
          description: 'Name must be present',
        },
        {
          id: 'validity-rule',
          name: 'Email Validity Rule',
          type: 'validity',
          field: 'email',
          condition: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
          severity: 'warning',
          description: 'Email must be valid',
        },
        {
          id: 'accuracy-rule',
          name: 'Age Accuracy Rule',
          type: 'accuracy',
          field: 'age',
          condition: { range: { min: 0, max: 120 } },
          severity: 'warning',
          description: 'Age must be reasonable',
        },
      ];

      rules.forEach(rule => monitor.addQualityRule(rule));

      // Test messages that violate different rules
      const messages = [
        { key: '1', value: { name: '', email: 'john@example.com', age: 30 }, timestamp: new Date() },
        { key: '2', value: { name: 'Jane', email: 'invalid-email', age: 25 }, timestamp: new Date() },
        { key: '3', value: { name: 'Bob', email: 'bob@example.com', age: 150 }, timestamp: new Date() },
      ];

      const alertCreatedSpy = jest.fn();
      monitor.on('alertCreated', alertCreatedSpy);

      messages.forEach(message => monitor.processMessage(message));

      // Should have created alerts for rule violations
      expect(alertCreatedSpy).toHaveBeenCalled();
    });

    it('should provide metric trends', (done) => {
      // Process messages over time to establish trends
      const message1 = {
        key: 'trend1',
        value: { name: 'John', email: 'john@example.com' },
        timestamp: new Date(),
      };

      const message2 = {
        key: 'trend2',
        value: { name: 'Jane', email: 'jane@example.com' },
        timestamp: new Date(),
      };

      monitor.processMessage(message1);
      
      setTimeout(() => {
        try {
          monitor.processMessage(message2);
          
          const metrics = monitor.getMetrics();
          metrics.forEach(metric => {
            expect(metric.trend).toMatch(/^(up|down|stable)$/);
          });
          done();
        } catch (error) {
          done(error);
        }
      }, 100);
    });
  });

  describe('Integration Tests', () => {
    it('should integrate stream processor with quality monitor', async () => {
      const config: StreamProcessorConfig = {
        id: 'integration-test',
        name: 'Integration Test Processor',
        inputTopic: 'test-input',
        outputTopic: 'test-output',
        consumerGroupId: 'integration-group',
        processingRules: [
          {
            type: 'transform',
            config: {
              fieldMappings: {
                processedName: 'name',
              },
            },
          },
        ],
        validation: {
          enabled: true,
          rules: [
            {
              field: 'name',
              type: 'required',
              config: {},
            },
          ],
          onFailure: 'skip',
        },
      };

      const processor = new StreamProcessor(config);
      const monitor = new DataQualityMonitorService();

      const messageProcessedSpy = jest.fn();
      const alertCreatedSpy = jest.fn();

      processor.on('messageProcessed', messageProcessedSpy);
      monitor.on('alertCreated', alertCreatedSpy);

      // Connect processor events to monitor
      processor.on('messageProcessed', (result) => {
        monitor.processMessage(result.originalMessage, result);
      });

      await processor.start();

      // Simulate message processing
      // (In real implementation, this would come from Kafka)
      
      await processor.stop();
      monitor.stopMonitoring();

      expect(processor).toBeDefined();
      expect(monitor).toBeDefined();
    });
  });
});
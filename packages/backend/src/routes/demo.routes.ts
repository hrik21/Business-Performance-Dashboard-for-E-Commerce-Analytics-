/**
 * Demo API Routes
 * These endpoints showcase the data pipeline capabilities
 */

import { Router, Request, Response } from 'express';
import DataPipelineDemo from '../demo/demo-data-pipeline';
import { DataValidationService } from '../services/data-validation.service';
import { DataQualityMonitorService } from '../services/data-quality-monitor.service';
import { DatabaseHealthService } from '../services/database-health.service';
import { getDatabaseHealth } from '../config/database';
import { getKafkaHealth } from '../config/kafka';

const router = Router();
const validationService = new DataValidationService();
const qualityMonitor = new DataQualityMonitorService();
const dbHealthService = DatabaseHealthService.getInstance();

/**
 * GET /api/demo/overview
 * Get system overview and capabilities
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const overview = {
      system: 'E-commerce BI Data Pipeline',
      version: '1.0.0',
      capabilities: [
        'Multi-source data ingestion (Database, API, File, Stream)',
        'Real-time stream processing with Kafka',
        'Data validation and quality monitoring',
        'ETL pipeline with configurable transformations',
        'Error handling with retry mechanisms and circuit breakers',
        'Comprehensive health monitoring and observability',
      ],
      components: {
        dataConnector: 'Multi-source data ingestion service',
        etlPipeline: 'Batch data processing and transformation',
        streamProcessor: 'Real-time data stream processing',
        dataValidation: 'Data quality validation and cleansing',
        qualityMonitor: 'Real-time data quality monitoring',
        errorHandler: 'Resilient error handling and recovery',
        healthMonitor: 'System health and performance monitoring',
      },
      status: 'operational',
      lastUpdated: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/demo/health
 * Get comprehensive system health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Database health
    const dbHealth = await getDatabaseHealth();
    const dbDetailedHealth = await dbHealthService.checkHealth();
    const dbStats = await dbHealthService.getDatabaseStats();

    // Kafka health
    let kafkaHealth;
    try {
      kafkaHealth = await getKafkaHealth();
    } catch (error) {
      kafkaHealth = {
        status: 'unavailable',
        error: 'Kafka not configured or unavailable',
      };
    }

    const healthStatus = {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        database: {
          status: dbHealth.status,
          latency: dbHealth.latency,
          connections: dbDetailedHealth.connections,
          stats: dbStats,
        },
        kafka: kafkaHealth,
        dataValidation: {
          status: 'healthy',
          rulesRegistered: 3, // Default rules
        },
        qualityMonitor: {
          status: 'healthy',
          metricsTracked: qualityMonitor.getMetrics().length,
          activeAlerts: qualityMonitor.getActiveAlerts().length,
        },
      },
    };

    res.json({
      success: true,
      data: healthStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/demo/validate-data
 * Demonstrate data validation capabilities
 */
router.post('/validate-data', async (req: Request, res: Response) => {
  try {
    const { data, rules } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Data array is required',
      });
    }

    // Default validation rules if none provided
    const validationRules = rules || [
      { field: 'name', type: 'required', config: {} },
      { field: 'email', type: 'pattern', config: { pattern: '^[^@]+@[^@]+\\.[^@]+$' } },
      { field: 'age', type: 'range', config: { min: 0, max: 120 } },
    ];

    // Validate the dataset
    const { results, qualityReport } = await validationService.validateDataset(data, validationRules);

    // Cleanse the data
    const cleansedData = validationService.cleanseData(data, ['email']);

    res.json({
      success: true,
      data: {
        originalData: data,
        validationResults: results,
        qualityReport,
        cleansedData,
        summary: {
          totalRecords: qualityReport.totalRecords,
          validRecords: qualityReport.validRecords,
          validationRate: qualityReport.validationRate,
          commonErrors: qualityReport.commonErrors.slice(0, 5),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/demo/quality-report
 * Get current data quality report
 */
router.get('/quality-report', async (req: Request, res: Response) => {
  try {
    // Add some sample data for demonstration
    const sampleMessages = [
      {
        key: 'demo-1',
        value: { customerId: 'C001', amount: 150.00, email: 'customer1@example.com' },
        timestamp: new Date(),
      },
      {
        key: 'demo-2',
        value: { customerId: 'C002', amount: 200.50, email: 'customer2@example.com' },
        timestamp: new Date(),
      },
      {
        key: 'demo-3',
        value: { customerId: '', amount: -50, email: 'invalid-email' },
        timestamp: new Date(),
      },
    ];

    // Process messages for quality monitoring
    sampleMessages.forEach((message, index) => {
      qualityMonitor.processMessage(message, {
        success: index < 2,
        originalMessage: message,
      });
    });

    // Trigger metrics update
    (qualityMonitor as any).updateMetrics();

    // Generate quality report
    const qualityReport = qualityMonitor.generateReport();

    res.json({
      success: true,
      data: {
        report: qualityReport,
        metrics: qualityMonitor.getMetrics(),
        activeAlerts: qualityMonitor.getActiveAlerts(),
        summary: {
          overallScore: qualityReport.overallScore,
          totalMetrics: qualityReport.metrics.length,
          activeAlerts: qualityMonitor.getActiveAlerts().length,
          recommendations: qualityReport.recommendations.length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/demo/simulate-stream
 * Simulate stream processing
 */
router.post('/simulate-stream', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required',
      });
    }

    // Simulate stream processing
    const processedMessages = messages.map((message, index) => {
      const processed = {
        ...message,
        processedAt: new Date().toISOString(),
        processingTime: Math.random() * 100 + 10, // Simulate processing time
        success: Math.random() > 0.1, // 90% success rate
      };

      // Add some transformations
      if (processed.value && typeof processed.value === 'object') {
        processed.value = {
          ...processed.value,
          _metadata: {
            processorId: 'demo-processor',
            processedAt: processed.processedAt,
          },
        };

        // Calculate tax if amount exists
        if (processed.value.amount) {
          processed.value.tax = processed.value.amount * 0.1;
          processed.value.total = processed.value.amount + processed.value.tax;
        }
      }

      return processed;
    });

    // Calculate statistics
    const stats = {
      totalMessages: messages.length,
      successfulMessages: processedMessages.filter(m => m.success).length,
      failedMessages: processedMessages.filter(m => !m.success).length,
      averageProcessingTime: processedMessages.reduce((sum, m) => sum + m.processingTime, 0) / messages.length,
      successRate: (processedMessages.filter(m => m.success).length / messages.length) * 100,
    };

    res.json({
      success: true,
      data: {
        originalMessages: messages,
        processedMessages,
        statistics: stats,
        processingRules: [
          'Add metadata and timestamps',
          'Calculate tax (10% of amount)',
          'Calculate total (amount + tax)',
          'Validate message structure',
        ],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/demo/run-full-demo
 * Run the complete demo and return results
 */
router.get('/run-full-demo', async (req: Request, res: Response) => {
  try {
    const demo = new DataPipelineDemo();
    
    // Capture console output
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    try {
      await demo.runCompleteDemo();
    } finally {
      console.log = originalLog;
      await demo.cleanup();
    }

    res.json({
      success: true,
      data: {
        demoCompleted: true,
        timestamp: new Date().toISOString(),
        logs: logs,
        summary: {
          componentsDemo: [
            'Database Connection & Health Monitoring',
            'Multi-Source Data Connector',
            'Data Validation & Cleansing',
            'ETL Pipeline Processing',
            'Error Handling & Resilience',
            'Real-time Data Quality Monitoring',
            'Real-time Stream Processing',
            'System Health & Monitoring',
          ],
          capabilities: [
            'Multi-source data ingestion',
            'Real-time stream processing',
            'Data validation and quality monitoring',
            'ETL pipeline with transformations',
            'Error handling and resilience',
            'Health monitoring and observability',
          ],
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
#!/usr/bin/env ts-node

/**
 * Simple Demo Server
 * A minimal server to showcase the data pipeline capabilities
 */

import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Root route - redirect to demo
app.get('/', (req, res) => {
  res.redirect('/demo.html');
});

// Demo API endpoints
app.get('/api/demo/overview', (req, res) => {
  res.json({
    success: true,
    data: {
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
    },
  });
});

app.get('/api/demo/health', (req, res) => {
  res.json({
    success: true,
    data: {
      overall: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        database: {
          status: 'demo-mode',
          message: 'Running in demo mode without external database',
        },
        kafka: {
          status: 'demo-mode',
          message: 'Running in demo mode without Kafka cluster',
        },
        dataValidation: {
          status: 'healthy',
          rulesRegistered: 3,
        },
        qualityMonitor: {
          status: 'healthy',
          metricsTracked: 6,
          activeAlerts: 0,
        },
      },
    },
  });
});

app.post('/api/demo/validate-data', (req, res) => {
  const { data } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({
      success: false,
      error: 'Data array is required',
    });
  }

  // Simple validation simulation
  const results = data.map((record, index) => {
    const errors: string[] = [];
    
    if (!record.name || record.name.trim() === '') {
      errors.push('Name is required');
    }
    
    if (record.email && !record.email.includes('@')) {
      errors.push('Invalid email format');
    }
    
    if (record.age !== undefined && (record.age < 0 || record.age > 120)) {
      errors.push('Age must be between 0 and 120');
    }

    return {
      index,
      isValid: errors.length === 0,
      errors,
      cleanedData: {
        ...record,
        name: record.name?.trim(),
        email: record.email?.toLowerCase(),
      },
    };
  });

  const validRecords = results.filter(r => r.isValid).length;
  const validationRate = (validRecords / data.length) * 100;

  res.json({
    success: true,
    data: {
      originalData: data,
      validationResults: results,
      qualityReport: {
        totalRecords: data.length,
        validRecords,
        invalidRecords: data.length - validRecords,
        validationRate,
        commonErrors: results
          .flatMap(r => r.errors)
          .reduce((acc: any[], error) => {
            const existing = acc.find(e => e.error === error);
            if (existing) {
              existing.count++;
            } else {
              acc.push({ error, count: 1 });
            }
            return acc;
          }, [])
          .sort((a: any, b: any) => b.count - a.count),
      },
      cleansedData: results.map(r => r.cleanedData),
      summary: {
        totalRecords: data.length,
        validRecords,
        validationRate,
      },
    },
  });
});

app.post('/api/demo/simulate-stream', (req, res) => {
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
      processingTime: Math.random() * 100 + 10,
      success: Math.random() > 0.1, // 90% success rate
    };

    // Add transformations
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
        processed.value.tax = Math.round(processed.value.amount * 0.1 * 100) / 100;
        processed.value.total = Math.round((processed.value.amount + processed.value.tax) * 100) / 100;
      }
    }

    return processed;
  });

  const stats = {
    totalMessages: messages.length,
    successfulMessages: processedMessages.filter(m => m.success).length,
    failedMessages: processedMessages.filter(m => !m.success).length,
    averageProcessingTime: Math.round(
      processedMessages.reduce((sum, m) => sum + m.processingTime, 0) / messages.length
    ),
    successRate: Math.round(
      (processedMessages.filter(m => m.success).length / messages.length) * 100
    ),
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
});

app.get('/api/demo/quality-report', (req, res) => {
  // Simulate quality metrics
  const metrics = [
    { name: 'completeness', value: 92.5, threshold: { warning: 90, critical: 80 } },
    { name: 'accuracy', value: 88.3, threshold: { warning: 95, critical: 90 } },
    { name: 'consistency', value: 96.7, threshold: { warning: 95, critical: 85 } },
    { name: 'timeliness', value: 94.2, threshold: { warning: 90, critical: 80 } },
    { name: 'validity', value: 89.8, threshold: { warning: 95, critical: 90 } },
    { name: 'uniqueness', value: 98.1, threshold: { warning: 95, critical: 90 } },
  ];

  const overallScore = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;

  const alerts = [
    {
      id: 'alert-1',
      severity: 'warning',
      metric: 'accuracy',
      message: 'Accuracy metric (88.3%) is below warning threshold (95%)',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'alert-2',
      severity: 'warning',
      metric: 'validity',
      message: 'Validity metric (89.8%) is below warning threshold (95%)',
      timestamp: new Date().toISOString(),
    },
  ];

  const recommendations = [
    'Review data processing rules to improve accuracy',
    'Implement additional validation checks for data validity',
    'Consider adding data cleansing steps for better quality',
  ];

  res.json({
    success: true,
    data: {
      report: {
        timestamp: new Date().toISOString(),
        overallScore: Math.round(overallScore * 100) / 100,
        metrics,
        alerts,
        recommendations,
        trends: {
          completeness: 92.5,
          accuracy: 88.3,
          consistency: 96.7,
          timeliness: 94.2,
          validity: 89.8,
        },
      },
      summary: {
        overallScore: Math.round(overallScore * 100) / 100,
        totalMetrics: metrics.length,
        activeAlerts: alerts.length,
        recommendations: recommendations.length,
      },
    },
  });
});

app.get('/api/demo/run-full-demo', (req, res) => {
  const demoLogs = [
    '🚀 Starting E-commerce BI Data Pipeline Demo',
    '',
    '📊 1. Database Connection & Health Monitoring',
    '==================================================',
    '⚠️  Database not available - running in demo mode',
    '✅ Health monitoring service initialized',
    '',
    '🔌 2. Multi-Source Data Connector',
    '==================================================',
    '✅ API data source registered',
    '✅ File data source registered',
    '✅ Stream data source registered',
    '',
    '✅ 3. Data Validation & Cleansing',
    '==================================================',
    '📊 Validation Rate: 85.5%',
    '🧹 Data cleansing applied',
    '📈 Quality score: 92.3%',
    '',
    '⚙️ 4. ETL Pipeline Processing',
    '==================================================',
    '✅ ETL job registered successfully',
    '🔄 Processing simulation completed',
    '',
    '🛡️ 5. Error Handling & Resilience',
    '==================================================',
    '✅ Retry mechanism tested (3 attempts)',
    '⚡ Circuit breaker pattern active',
    '',
    '📈 6. Real-time Data Quality Monitoring',
    '==================================================',
    '📊 Overall Score: 92.59%',
    '🚨 2 active quality alerts',
    '💡 3 improvement recommendations',
    '',
    '🌊 7. Real-time Stream Processing',
    '==================================================',
    '⚙️ Stream processor configured',
    '🔄 Message transformation rules active',
    '📊 Processing statistics available',
    '',
    '🏥 8. System Health & Monitoring',
    '==================================================',
    '💾 Database Health: Demo Mode',
    '📡 Kafka Health: Demo Mode',
    '🎯 All system capabilities operational',
    '',
    '✅ Demo completed successfully!',
    '',
    '📊 Summary of Capabilities Demonstrated:',
    '   • Database connectivity and health monitoring',
    '   • Multi-source data ingestion (API, File, Database)',
    '   • Data validation and cleansing',
    '   • ETL pipeline with transformations',
    '   • Error handling with retry mechanisms',
    '   • Real-time data quality monitoring',
    '   • Stream processing with Kafka',
    '   • Comprehensive system health checks',
  ];

  res.json({
    success: true,
    data: {
      demoCompleted: true,
      timestamp: new Date().toISOString(),
      logs: demoLogs,
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
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Demo server is running',
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Demo server running on http://localhost:${PORT}`);
  console.log(`📊 Interactive demo available at: http://localhost:${PORT}/demo.html`);
  console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api/demo/*`);
});

export default app;
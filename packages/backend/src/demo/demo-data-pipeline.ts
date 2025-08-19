/**
 * Demo Script for Data Pipeline Foundation
 * This script demonstrates the key features of the implemented data pipeline
 */

import { DataConnector, DataSourceConfig } from '../services/data-connector.service';
import { ETLPipelineService, ETLJobConfig } from '../services/etl-pipeline.service';
import { DataValidationService } from '../services/data-validation.service';
import { StreamProcessor, StreamProcessorConfig } from '../services/stream-processor.service';
import { DataQualityMonitorService } from '../services/data-quality-monitor.service';
import { ErrorHandlerService } from '../services/error-handler.service';
import { DatabaseHealthService } from '../services/database-health.service';
import { testDatabaseConnection, getDatabaseHealth } from '../config/database';
import { getKafkaHealth } from '../config/kafka';

export class DataPipelineDemo {
    private dataConnector: DataConnector;
    private etlService: ETLPipelineService;
    private validationService: DataValidationService;
    private qualityMonitor: DataQualityMonitorService;
    private errorHandler: ErrorHandlerService;
    private dbHealthService: DatabaseHealthService;

    constructor() {
        this.dataConnector = new DataConnector();
        this.etlService = new ETLPipelineService(this.dataConnector);
        this.validationService = new DataValidationService();
        this.qualityMonitor = new DataQualityMonitorService();
        this.errorHandler = new ErrorHandlerService();
        this.dbHealthService = DatabaseHealthService.getInstance();
    }

    /**
     * Run complete demo showcasing all features
     */
    async runCompleteDemo(): Promise<void> {
        console.log('🚀 Starting E-commerce BI Data Pipeline Demo\n');

        try {
            // 1. Database Connection Demo
            await this.demonstrateDatabase();

            // 2. Data Connector Demo
            await this.demonstrateDataConnector();

            // 3. Data Validation Demo
            await this.demonstrateDataValidation();

            // 4. ETL Pipeline Demo
            await this.demonstrateETLPipeline();

            // 5. Error Handling Demo
            await this.demonstrateErrorHandling();

            // 6. Data Quality Monitoring Demo
            await this.demonstrateDataQuality();

            // 7. Stream Processing Demo
            await this.demonstrateStreamProcessing();

            // 8. System Health Demo
            await this.demonstrateSystemHealth();

            console.log('\n✅ Demo completed successfully!');
            console.log('\n📊 Summary of Capabilities Demonstrated:');
            console.log('   • Database connectivity and health monitoring');
            console.log('   • Multi-source data ingestion (API, File, Database)');
            console.log('   • Data validation and cleansing');
            console.log('   • ETL pipeline with transformations');
            console.log('   • Error handling with retry mechanisms');
            console.log('   • Real-time data quality monitoring');
            console.log('   • Stream processing with Kafka');
            console.log('   • Comprehensive system health checks');

        } catch (error) {
            console.error('❌ Demo failed:', error);
        }
    }

    private async demonstrateDatabase(): Promise<void> {
        console.log('📊 1. Database Connection & Health Monitoring');
        console.log('='.repeat(50));

        // Test database connection
        const isConnected = await testDatabaseConnection();
        console.log(`Database Connection: ${isConnected ? '✅ Connected' : '❌ Failed'}`);

        // Get database health
        const dbHealth = await getDatabaseHealth();
        console.log(`Database Status: ${dbHealth.status}`);
        console.log(`Database Latency: ${dbHealth.latency}ms`);

        // Get detailed health metrics
        const healthStatus = await this.dbHealthService.checkHealth();
        console.log(`Connection Pool - Active: ${healthStatus.connections.active}, Idle: ${healthStatus.connections.idle}`);

        // Get database statistics
        const stats = await this.dbHealthService.getDatabaseStats();
        console.log(`Database Tables: ${stats.tableCount}`);
        console.log(`Database Size: ${stats.totalSize}`);
        console.log(`Active Connections: ${stats.connectionCount}`);

        console.log('');
    }

    private async demonstrateDataConnector(): Promise<void> {
        console.log('🔌 2. Multi-Source Data Connector');
        console.log('='.repeat(50));

        // Register different data sources
        const apiSource: DataSourceConfig = {
            id: 'demo-api',
            name: 'Demo API Source',
            type: 'api',
            config: {
                baseUrl: 'https://jsonplaceholder.typicode.com',
                endpoints: { users: '/users' },
                timeout: 5000,
            },
        };

        const fileSource: DataSourceConfig = {
            id: 'demo-file',
            name: 'Demo File Source',
            type: 'file',
            config: {
                path: '/tmp/demo-data.json',
                format: 'json',
            },
        };

        try {
            await this.dataConnector.registerDataSource(apiSource);
            console.log('✅ API data source registered');

            await this.dataConnector.registerDataSource(fileSource);
            console.log('✅ File data source registered');
        } catch (error) {
            console.log('⚠️  Data source registration (expected in demo environment)');
        }

        // Show connection status
        const status = this.dataConnector.getConnectionStatus();
        console.log('📋 Registered Data Sources:');
        Object.entries(status).forEach(([id, info]) => {
            console.log(`   • ${info.name} (${info.type}): ${info.status}`);
        });

        console.log('');
    }

    private async demonstrateDataValidation(): Promise<void> {
        console.log('✅ 3. Data Validation & Cleansing');
        console.log('='.repeat(50));

        // Sample data with quality issues
        const sampleData = [
            { name: '  John Doe  ', email: 'john@example.com', age: 30, revenue: 1500.50 },
            { name: 'Jane Smith', email: 'JANE@EXAMPLE.COM', age: 25, revenue: 2000 },
            { name: '', email: 'invalid-email', age: -5, revenue: null },
            { name: 'Bob Wilson', email: 'bob@test.com', age: 150, revenue: 'invalid' },
        ];

        // Define validation rules
        const validationRules = [
            { field: 'name', type: 'required' as const, config: {} },
            { field: 'email', type: 'pattern' as const, config: { pattern: '^[^@]+@[^@]+\\.[^@]+$' } },
            { field: 'age', type: 'range' as const, config: { min: 0, max: 120 } },
            { field: 'revenue', type: 'type' as const, config: { type: 'number' } },
        ];

        console.log('📝 Sample Data (with quality issues):');
        sampleData.forEach((record, index) => {
            console.log(`   ${index + 1}. ${JSON.stringify(record)}`);
        });

        // Validate dataset
        const { results, qualityReport } = await this.validationService.validateDataset(sampleData, validationRules);

        console.log('\n📊 Data Quality Report:');
        console.log(`   Total Records: ${qualityReport.totalRecords}`);
        console.log(`   Valid Records: ${qualityReport.validRecords}`);
        console.log(`   Invalid Records: ${qualityReport.invalidRecords}`);
        console.log(`   Validation Rate: ${qualityReport.validationRate.toFixed(2)}%`);

        // Show common errors
        if (qualityReport.commonErrors.length > 0) {
            console.log('\n🚨 Common Validation Errors:');
            qualityReport.commonErrors.slice(0, 3).forEach(error => {
                console.log(`   • ${error.error} (${error.count} occurrences)`);
            });
        }

        // Demonstrate data cleansing
        const cleansedData = this.validationService.cleanseData(sampleData, ['email']);
        console.log('\n🧹 Data After Cleansing:');
        cleansedData.slice(0, 2).forEach((record, index) => {
            console.log(`   ${index + 1}. ${JSON.stringify(record)}`);
        });

        console.log('');
    }

    private async demonstrateETLPipeline(): Promise<void> {
        console.log('⚙️ 4. ETL Pipeline Processing');
        console.log('='.repeat(50));

        // Define ETL job configuration
        const etlJob: ETLJobConfig = {
            id: 'demo-etl-job',
            name: 'Demo Sales Data ETL',
            description: 'Process and transform sales data',
            source: {
                dataSourceId: 'demo-api',
                query: 'SELECT * FROM sales_data',
                batchSize: 100,
            },
            transformations: [
                {
                    type: 'map',
                    config: {
                        mapping: {
                            customer_name: 'name',
                            customer_email: 'email',
                            order_total: 'revenue',
                        },
                    },
                    description: 'Map fields to standard schema',
                },
                {
                    type: 'filter',
                    config: {
                        conditions: [
                            { field: 'order_total', operator: 'greater_than', value: 0 },
                        ],
                    },
                    description: 'Filter out invalid orders',
                },
            ],
            destination: {
                table: 'processed_sales',
                mode: 'upsert',
                keyColumns: ['customer_email'],
            },
            validation: {
                enabled: true,
                rules: [
                    { field: 'customer_name', type: 'required', config: {} },
                    { field: 'customer_email', type: 'pattern', config: { pattern: '^[^@]+@[^@]+\\.[^@]+$' } },
                ],
                onFailure: 'skip',
            },
        };

        // Register ETL job
        this.etlService.registerJob(etlJob);
        console.log('✅ ETL job registered successfully');

        // Show job configuration
        const jobs = this.etlService.getJobs();
        console.log(`📋 Registered ETL Jobs: ${jobs.length}`);
        jobs.forEach(job => {
            console.log(`   • ${job.name}: ${job.transformations.length} transformations`);
        });

        // Simulate job execution (would normally process real data)
        console.log('\n🔄 ETL Job Execution Simulation:');
        console.log('   1. ✅ Data extraction from source');
        console.log('   2. ✅ Field mapping transformation applied');
        console.log('   3. ✅ Data filtering completed');
        console.log('   4. ✅ Validation rules applied');
        console.log('   5. ✅ Data loaded to destination');

        console.log('');
    }

    private async demonstrateErrorHandling(): Promise<void> {
        console.log('🛡️ 5. Error Handling & Resilience');
        console.log('='.repeat(50));

        // Demonstrate retry mechanism
        console.log('🔄 Retry Mechanism Demo:');

        let attempts = 0;
        const flakyOperation = async () => {
            attempts++;
            if (attempts < 3) {
                throw new Error('Temporary connection failure');
            }
            return 'Operation successful';
        };

        try {
            const result = await this.errorHandler.executeWithRetry('demo-operation', flakyOperation, {
                maxRetries: 3,
                initialDelay: 100,
                maxDelay: 1000,
                backoffMultiplier: 2,
                retryableErrors: ['Temporary connection failure'],
            });
            console.log(`   ✅ ${result} (after ${attempts} attempts)`);
        } catch (error) {
            console.log(`   ❌ Operation failed: ${error}`);
        }

        // Show error statistics
        const errorStats = this.errorHandler.getAllErrorStats();
        console.log('\n📊 Error Statistics:');
        Object.entries(errorStats).forEach(([operation, stats]) => {
            console.log(`   • ${operation}: ${stats.count} errors`);
        });

        // Demonstrate circuit breaker
        console.log('\n⚡ Circuit Breaker Pattern:');
        console.log('   • Monitors failure rates');
        console.log('   • Opens circuit after threshold failures');
        console.log('   • Provides fast-fail responses');
        console.log('   • Automatically attempts recovery');

        console.log('');
    }

    private async demonstrateDataQuality(): Promise<void> {
        console.log('📈 6. Real-time Data Quality Monitoring');
        console.log('='.repeat(50));

        // Process sample messages for quality monitoring
        const sampleMessages = [
            {
                key: 'order-1',
                value: { customerId: 'C001', amount: 150.00, email: 'customer1@example.com' },
                timestamp: new Date(),
            },
            {
                key: 'order-2',
                value: { customerId: 'C002', amount: 200.50, email: 'customer2@example.com' },
                timestamp: new Date(),
            },
            {
                key: 'order-3',
                value: { customerId: '', amount: -50, email: 'invalid-email' },
                timestamp: new Date(),
            },
        ];

        console.log('📝 Processing sample messages for quality analysis...');
        sampleMessages.forEach((message, index) => {
            this.qualityMonitor.processMessage(message, {
                success: index < 2, // First two succeed, third fails
                originalMessage: message,
            });
        });

        // Trigger metrics update
        (this.qualityMonitor as any).updateMetrics();

        // Generate quality report
        const qualityReport = this.qualityMonitor.generateReport();
        console.log('\n📊 Data Quality Metrics:');
        console.log(`   Overall Score: ${qualityReport.overallScore.toFixed(2)}%`);
        console.log(`   Completeness: ${qualityReport.trends.completeness.toFixed(2)}%`);
        console.log(`   Accuracy: ${qualityReport.trends.accuracy.toFixed(2)}%`);
        console.log(`   Validity: ${qualityReport.trends.validity.toFixed(2)}%`);

        // Show active alerts
        const alerts = this.qualityMonitor.getActiveAlerts();
        if (alerts.length > 0) {
            console.log('\n🚨 Active Quality Alerts:');
            alerts.slice(0, 3).forEach(alert => {
                console.log(`   • ${alert.severity.toUpperCase()}: ${alert.message}`);
            });
        }

        // Show recommendations
        if (qualityReport.recommendations.length > 0) {
            console.log('\n💡 Quality Improvement Recommendations:');
            qualityReport.recommendations.slice(0, 3).forEach(rec => {
                console.log(`   • ${rec}`);
            });
        }

        console.log('');
    }

    private async demonstrateStreamProcessing(): Promise<void> {
        console.log('🌊 7. Real-time Stream Processing');
        console.log('='.repeat(50));

        // Stream processor configuration
        const streamConfig: StreamProcessorConfig = {
            id: 'demo-stream-processor',
            name: 'Demo Sales Stream Processor',
            inputTopic: 'sales-events',
            outputTopic: 'processed-sales',
            consumerGroupId: 'demo-group',
            processingRules: [
                {
                    type: 'transform',
                    config: {
                        fieldMappings: {
                            processedAmount: 'amount',
                            customerRef: 'customerId',
                        },
                        calculations: {
                            tax: { type: 'multiply', fields: ['amount'], multiplier: 0.1 },
                        },
                    },
                    description: 'Transform and calculate tax',
                },
                {
                    type: 'enrich',
                    config: {
                        addTimestamp: true,
                        addMetadata: true,
                    },
                    description: 'Enrich with metadata',
                },
            ],
            validation: {
                enabled: true,
                rules: [
                    { field: 'customerId', type: 'required', config: {} },
                    { field: 'amount', type: 'range', config: { min: 0, max: 10000 } },
                ],
                onFailure: 'skip',
            },
        };

        const streamProcessor = new StreamProcessor(streamConfig);

        console.log('⚙️ Stream Processor Configuration:');
        console.log(`   • Input Topic: ${streamConfig.inputTopic}`);
        console.log(`   • Output Topic: ${streamConfig.outputTopic}`);
        console.log(`   • Processing Rules: ${streamConfig.processingRules.length}`);
        console.log(`   • Validation: ${streamConfig.validation?.enabled ? 'Enabled' : 'Disabled'}`);

        // Show processing capabilities
        console.log('\n🔄 Stream Processing Capabilities:');
        console.log('   • Real-time message transformation');
        console.log('   • Data validation and filtering');
        console.log('   • Batch processing support');
        console.log('   • Error handling and dead letter queues');
        console.log('   • Performance monitoring and statistics');

        // Show statistics
        const stats = streamProcessor.getStats();
        console.log('\n📊 Processor Statistics:');
        console.log(`   • Messages Processed: ${stats.messagesProcessed}`);
        console.log(`   • Success Rate: ${stats.messagesSuccessful}/${stats.messagesProcessed}`);
        console.log(`   • Average Processing Time: ${stats.averageProcessingTime}ms`);
        console.log(`   • Throughput: ${stats.throughputPerSecond.toFixed(2)} msg/sec`);

        console.log('');
    }

    private async demonstrateSystemHealth(): Promise<void> {
        console.log('🏥 8. System Health & Monitoring');
        console.log('='.repeat(50));

        // Database health
        const dbHealth = await this.dbHealthService.checkHealth();
        console.log('💾 Database Health:');
        console.log(`   Status: ${dbHealth.status}`);
        console.log(`   Latency: ${dbHealth.latency}ms`);
        console.log(`   Connections: ${dbHealth.connections.active} active, ${dbHealth.connections.idle} idle`);

        // Kafka health (will show error in demo environment)
        try {
            const kafkaHealth = await getKafkaHealth();
            console.log('\n📡 Kafka Health:');
            console.log(`   Status: ${kafkaHealth.status}`);
            console.log(`   Brokers: ${kafkaHealth.brokers.join(', ')}`);
            console.log(`   Topics: ${kafkaHealth.topics.length} available`);
        } catch (error) {
            console.log('\n📡 Kafka Health: ⚠️  Not available in demo environment');
        }

        // System capabilities summary
        console.log('\n🎯 System Capabilities:');
        console.log('   ✅ Multi-source data ingestion');
        console.log('   ✅ Real-time stream processing');
        console.log('   ✅ Data validation and quality monitoring');
        console.log('   ✅ ETL pipeline with transformations');
        console.log('   ✅ Error handling and resilience');
        console.log('   ✅ Health monitoring and observability');
        console.log('   ✅ Scalable and modular architecture');

        console.log('');
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        await this.dataConnector.closeAllConnections();
        this.qualityMonitor.stopMonitoring();
    }
}

// Export for use in other modules
export default DataPipelineDemo;
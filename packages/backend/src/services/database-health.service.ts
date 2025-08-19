/**
 * Database health monitoring service
 */

import { getDatabaseHealth } from '../config/database';
import { sequelize } from '../models';

export interface DatabaseHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  lastCheck: Date;
  error?: string;
}

export class DatabaseHealthService {
  private static instance: DatabaseHealthService;
  private healthStatus: DatabaseHealthStatus | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): DatabaseHealthService {
    if (!DatabaseHealthService.instance) {
      DatabaseHealthService.instance = new DatabaseHealthService();
    }
    return DatabaseHealthService.instance;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs: number = 30000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      await this.checkHealth();
    }, intervalMs);

    // Initial check
    this.checkHealth();
  }

  /**
   * Stop periodic health checks
   */
  stopHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Perform a health check
   */
  async checkHealth(): Promise<DatabaseHealthStatus> {
    try {
      const startTime = Date.now();
      
      // Test basic connectivity
      const healthResult = await getDatabaseHealth();
      
      // Get connection pool information
      const pool = (sequelize.connectionManager as any).pool;
      const connections = {
        active: pool?.used || 0,
        idle: pool?.available || 0,
        total: (pool?.used || 0) + (pool?.available || 0),
      };

      const latency = Date.now() - startTime;

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (healthResult.status === 'unhealthy') {
        status = 'unhealthy';
      } else if (latency > 1000 || connections.active > (connections.total * 0.8)) {
        status = 'degraded';
      }

      this.healthStatus = {
        status,
        latency,
        connections,
        lastCheck: new Date(),
        error: healthResult.error,
      };

      return this.healthStatus;
    } catch (error) {
      this.healthStatus = {
        status: 'unhealthy',
        latency: -1,
        connections: { active: 0, idle: 0, total: 0 },
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return this.healthStatus;
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): DatabaseHealthStatus | null {
    return this.healthStatus;
  }

  /**
   * Test database query performance
   */
  async testQueryPerformance(): Promise<{
    simpleQuery: number;
    complexQuery: number;
    insertQuery: number;
  }> {
    const results = {
      simpleQuery: 0,
      complexQuery: 0,
      insertQuery: 0,
    };

    try {
      // Simple query test
      const simpleStart = Date.now();
      await sequelize.query('SELECT 1 as test');
      results.simpleQuery = Date.now() - simpleStart;

      // Complex query test (if tables exist)
      const complexStart = Date.now();
      await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      results.complexQuery = Date.now() - complexStart;

      // Insert test (using a temporary table)
      const insertStart = Date.now();
      await sequelize.query(`
        CREATE TEMP TABLE IF NOT EXISTS health_test (
          id SERIAL PRIMARY KEY,
          test_data TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await sequelize.query(`
        INSERT INTO health_test (test_data) VALUES ('health_check_${Date.now()}')
      `);
      results.insertQuery = Date.now() - insertStart;

    } catch (error) {
      console.error('Error testing query performance:', error);
    }

    return results;
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    tableCount: number;
    totalSize: string;
    connectionCount: number;
  }> {
    try {
      // Get table count
      const [tableCountResult] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `) as any[];

      // Get database size
      const [sizeResult] = await sequelize.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `) as any[];

      // Get connection count
      const [connectionResult] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `) as any[];

      return {
        tableCount: parseInt(tableCountResult[0]?.count || '0'),
        totalSize: sizeResult[0]?.size || 'Unknown',
        connectionCount: parseInt(connectionResult[0]?.count || '0'),
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {
        tableCount: 0,
        totalSize: 'Unknown',
        connectionCount: 0,
      };
    }
  }
}
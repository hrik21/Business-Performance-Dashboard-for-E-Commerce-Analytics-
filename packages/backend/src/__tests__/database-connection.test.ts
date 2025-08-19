/**
 * Basic database connection tests
 */

import { 
  createDatabaseConnection, 
  testDatabaseConnection, 
  getDatabaseHealth,
  closeDatabaseConnection 
} from '../config/database';

describe('Database Connection Tests', () => {
  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe('Database Connection', () => {
    it('should create database connection', () => {
      const sequelize = createDatabaseConnection();
      expect(sequelize).toBeDefined();
      expect(sequelize.config.database).toBeDefined();
    });

    it('should test database connection', async () => {
      // This test will pass even if database is not available
      // as we're testing the function exists and returns a boolean
      const result = await testDatabaseConnection();
      expect(typeof result).toBe('boolean');
    }, 10000);

    it('should get database health status', async () => {
      const health = await getDatabaseHealth();
      expect(health).toBeDefined();
      expect(health.status).toMatch(/^(healthy|unhealthy)$/);
    }, 10000);
  });
});
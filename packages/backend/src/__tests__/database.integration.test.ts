/**
 * Database integration tests
 */

import { Sequelize } from 'sequelize';
import { 
  createDatabaseConnection, 
  testDatabaseConnection, 
  getDatabaseHealth,
  closeDatabaseConnection 
} from '../config/database';
import { 
  User, 
  Role, 
  Permission, 
  SalesMetric, 
  CustomerBehavior, 
  CustomerSegment,
  SupplyChainKPI,
  Product,
  Warehouse,
  Supplier,
  syncDatabase 
} from '../models';
import { DatabaseHealthService } from '../services/database-health.service';

describe('Database Integration Tests', () => {
  let sequelize: Sequelize;
  let healthService: DatabaseHealthService;

  beforeAll(async () => {
    // Use test database configuration
    process.env.DB_NAME = 'ecommerce_bi_test';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'password';

    sequelize = createDatabaseConnection();
    healthService = DatabaseHealthService.getInstance();

    // Sync database with force to ensure clean state
    await syncDatabase({ force: true });
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  describe('Database Connection', () => {
    it('should establish database connection successfully', async () => {
      const isConnected = await testDatabaseConnection();
      expect(isConnected).toBe(true);
    });

    it('should return healthy status for database health check', async () => {
      const health = await getDatabaseHealth();
      expect(health.status).toBe('healthy');
      expect(health.latency).toBeGreaterThan(0);
    });
  });

  describe('Model Operations', () => {
    describe('User and Role Models', () => {
      it('should create and retrieve a role', async () => {
        const role = await Role.create({
          name: 'test_role',
          description: 'Test role for integration testing',
        });

        expect(role.id).toBeDefined();
        expect(role.name).toBe('test_role');
        expect(role.description).toBe('Test role for integration testing');

        const foundRole = await Role.findByPk(role.id);
        expect(foundRole).toBeTruthy();
        expect(foundRole?.name).toBe('test_role');
      });

      it('should create and retrieve a user with role association', async () => {
        const role = await Role.create({
          name: 'user_role',
          description: 'User role for testing',
        });

        const user = await User.create({
          email: 'test@example.com',
          passwordHash: 'hashed_password',
          firstName: 'Test',
          lastName: 'User',
          roleId: role.id,
          isActive: true,
        });

        expect(user.id).toBeDefined();
        expect(user.email).toBe('test@example.com');
        expect(user.getFullName()).toBe('Test User');

        // Test association
        const userWithRole = await User.findByPk(user.id, {
          include: [{ model: Role, as: 'role' }],
        });

        expect(userWithRole?.role?.name).toBe('user_role');
      });
    });

    describe('Sales Metric Model', () => {
      it('should create and retrieve sales metrics', async () => {
        const salesMetric = await SalesMetric.create({
          timestamp: new Date(),
          revenue: 1500.50,
          orderCount: 25,
          averageOrderValue: 60.02,
          conversionRate: 0.0325,
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-02'),
          granularity: 'day',
          productCategory: 'Electronics',
          region: 'North America',
          channel: 'Online',
        });

        expect(salesMetric.id).toBeDefined();
        expect(salesMetric.revenue).toBe('1500.50');
        expect(salesMetric.orderCount).toBe(25);
        expect(salesMetric.granularity).toBe('day');

        const foundMetric = await SalesMetric.findByPk(salesMetric.id);
        expect(foundMetric).toBeTruthy();
        expect(foundMetric?.productCategory).toBe('Electronics');
      });
    });

    describe('Customer Behavior Model', () => {
      it('should create customer segment and behavior with association', async () => {
        const segment = await CustomerSegment.create({
          name: 'High Value Customers',
          description: 'Customers with high lifetime value',
          criteria: { min_ltv: 1000, min_frequency: 5 },
        });

        const behavior = await CustomerBehavior.create({
          customerId: '123e4567-e89b-12d3-a456-426614174000',
          sessionId: 'session_123',
          pageViews: 15,
          timeOnSite: 1800,
          purchaseIntent: 0.85,
          segmentId: segment.id,
          lifetimeValue: 1250.00,
          lastActivity: new Date(),
          acquisitionChannel: 'Google Ads',
          churnRisk: 0.15,
          averageOrderValue: 125.00,
          purchaseFrequency: 2.5,
        });

        expect(behavior.id).toBeDefined();
        expect(behavior.customerId).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(behavior.purchaseIntent).toBe('0.85');

        // Test association
        const behaviorWithSegment = await CustomerBehavior.findByPk(behavior.id, {
          include: [{ model: CustomerSegment, as: 'segment' }],
        });

        expect(behaviorWithSegment?.segment?.name).toBe('High Value Customers');
      });
    });

    describe('Supply Chain Models', () => {
      it('should create supply chain entities with associations', async () => {
        // Create supporting entities
        const product = await Product.create({
          name: 'Test Product',
          sku: 'TEST-001',
          category: 'Test Category',
          unitCost: 25.00,
          unitPrice: 50.00,
          weight: 1.5,
          dimensions: { length: 10, width: 5, height: 3 },
          isActive: true,
        });

        const warehouse = await Warehouse.create({
          name: 'Main Warehouse',
          location: 'New York',
          address: '123 Warehouse St',
          capacity: 10000,
          isActive: true,
        });

        const supplier = await Supplier.create({
          name: 'Test Supplier',
          contactEmail: 'supplier@example.com',
          contactPhone: '+1-555-0123',
          address: '456 Supplier Ave',
          performanceRating: 4.5,
          isActive: true,
        });

        // Create supply chain KPI
        const kpi = await SupplyChainKPI.create({
          productId: product.id,
          warehouseId: warehouse.id,
          supplierId: supplier.id,
          currentStock: 150,
          reorderPoint: 50,
          leadTime: 7,
          supplierPerformance: 0.95,
          fulfillmentRate: 0.98,
          stockoutRisk: 'low',
          averageDemand: 25.5,
          lastUpdated: new Date(),
        });

        expect(kpi.id).toBeDefined();
        expect(kpi.currentStock).toBe(150);
        expect(kpi.stockoutRisk).toBe('low');

        // Test associations
        const kpiWithAssociations = await SupplyChainKPI.findByPk(kpi.id, {
          include: [
            { model: Product, as: 'product' },
            { model: Warehouse, as: 'warehouse' },
            { model: Supplier, as: 'supplier' },
          ],
        });

        expect(kpiWithAssociations?.product?.name).toBe('Test Product');
        expect(kpiWithAssociations?.warehouse?.name).toBe('Main Warehouse');
        expect(kpiWithAssociations?.supplier?.name).toBe('Test Supplier');
      });
    });
  });

  describe('Database Health Service', () => {
    it('should perform health check successfully', async () => {
      const health = await healthService.checkHealth();
      
      expect(health.status).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(health.latency).toBeGreaterThanOrEqual(0);
      expect(health.connections).toBeDefined();
      expect(health.lastCheck).toBeInstanceOf(Date);
    });

    it('should test query performance', async () => {
      const performance = await healthService.testQueryPerformance();
      
      expect(performance.simpleQuery).toBeGreaterThan(0);
      expect(performance.complexQuery).toBeGreaterThan(0);
      expect(performance.insertQuery).toBeGreaterThan(0);
    });

    it('should get database statistics', async () => {
      const stats = await healthService.getDatabaseStats();
      
      expect(stats.tableCount).toBeGreaterThan(0);
      expect(stats.totalSize).toBeDefined();
      expect(stats.connectionCount).toBeGreaterThan(0);
    });
  });

  describe('Database Constraints and Validations', () => {
    it('should enforce unique constraints', async () => {
      await Role.create({
        name: 'unique_role',
        description: 'Test unique constraint',
      });

      // Attempt to create duplicate role
      await expect(
        Role.create({
          name: 'unique_role',
          description: 'Duplicate role',
        })
      ).rejects.toThrow();
    });

    it('should enforce validation rules', async () => {
      // Test email validation
      await expect(
        User.create({
          email: 'invalid-email',
          passwordHash: 'password',
          firstName: 'Test',
          lastName: 'User',
          isActive: true,
        })
      ).rejects.toThrow();

      // Test numeric range validation
      await expect(
        SalesMetric.create({
          timestamp: new Date(),
          revenue: -100, // Should fail - negative revenue
          orderCount: 10,
          averageOrderValue: 50,
          conversionRate: 0.5,
          periodStart: new Date(),
          periodEnd: new Date(),
          granularity: 'day',
        })
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraints', async () => {
      // Attempt to create user with non-existent role
      await expect(
        User.create({
          email: 'test@example.com',
          passwordHash: 'password',
          firstName: 'Test',
          lastName: 'User',
          roleId: '00000000-0000-0000-0000-000000000000', // Non-existent role
          isActive: true,
        })
      ).rejects.toThrow();
    });
  });
});
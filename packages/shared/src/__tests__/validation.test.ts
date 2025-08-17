import { validateSalesMetric, validateUser } from '../schemas/validation';
import { SalesMetric, User } from '../types/business-entities';

describe('Validation Tests', () => {
  describe('validateSalesMetric', () => {
    it('should validate a correct sales metric', () => {
      const validSalesMetric: SalesMetric = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date(),
        revenue: 1000.50,
        orderCount: 10,
        averageOrderValue: 100.05,
        conversionRate: 0.15,
        period: {
          start: new Date('2023-01-01'),
          end: new Date('2023-01-31'),
          granularity: 'month',
        },
        productCategory: 'Electronics',
        region: 'North America',
        channel: 'Online',
      };

      expect(() => validateSalesMetric(validSalesMetric)).not.toThrow();
    });

    it('should throw error for invalid sales metric', () => {
      const invalidSalesMetric = {
        id: 'invalid-uuid',
        revenue: -100, // negative revenue should be invalid
        orderCount: 'not-a-number',
      };

      expect(() => validateSalesMetric(invalidSalesMetric)).toThrow();
    });
  });
});
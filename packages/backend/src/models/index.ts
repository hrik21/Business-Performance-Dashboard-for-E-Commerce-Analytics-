/**
 * Model initialization and associations
 */

import { Sequelize } from 'sequelize';
import { getDatabase } from '../config/database';

// Import all models
import { User } from './user.model';
import { Role } from './role.model';
import { Permission } from './permission.model';
import { SalesMetric } from './sales-metric.model';
import { CustomerBehavior } from './customer-behavior.model';
import { CustomerSegment } from './customer-segment.model';
import { SupplyChainKPI } from './supply-chain-kpi.model';
import { Product } from './product.model';
import { Warehouse } from './warehouse.model';
import { Supplier } from './supplier.model';

// Initialize database connection
const sequelize = getDatabase();

// Initialize all models
const models = {
  User: User.initModel(sequelize),
  Role: Role.initModel(sequelize),
  Permission: Permission.initModel(sequelize),
  SalesMetric: SalesMetric.initModel(sequelize),
  CustomerBehavior: CustomerBehavior.initModel(sequelize),
  CustomerSegment: CustomerSegment.initModel(sequelize),
  SupplyChainKPI: SupplyChainKPI.initModel(sequelize),
  Product: Product.initModel(sequelize),
  Warehouse: Warehouse.initModel(sequelize),
  Supplier: Supplier.initModel(sequelize),
};

// Set up associations
const setupAssociations = () => {
  // User associations
  User.associate();
  
  // Role associations
  Role.associate();
  
  // Permission associations
  Permission.associate();
  
  // Customer behavior associations
  CustomerBehavior.associate();
  CustomerSegment.associate();
  
  // Supply chain associations
  SupplyChainKPI.associate();
  Product.associate();
  Warehouse.associate();
  Supplier.associate();
};

// Initialize associations
setupAssociations();

// Sync database (create tables if they don't exist)
export const syncDatabase = async (options: { force?: boolean; alter?: boolean } = {}) => {
  try {
    await sequelize.sync(options);
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error;
  }
};

// Export models and sequelize instance
export {
  sequelize,
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
};

export default models;
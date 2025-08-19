/**
 * Database configuration and connection setup
 */

import { Sequelize, Options } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration interface
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dialect: 'postgres';
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  logging: boolean | ((sql: string) => void);
  dialectOptions?: any;
}

// Get database configuration from environment variables
export const getDatabaseConfig = (): DatabaseConfig => {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ecommerce_bi',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    dialect: 'postgres',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      min: parseInt(process.env.DB_POOL_MIN || '0'),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  };
};

// Create Sequelize instance
let sequelize: Sequelize | null = null;

export const createDatabaseConnection = (): Sequelize => {
  if (sequelize) {
    return sequelize;
  }

  const config = getDatabaseConfig();
  
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config as Options
  );

  return sequelize;
};

// Get existing connection or create new one
export const getDatabase = (): Sequelize => {
  if (!sequelize) {
    sequelize = createDatabaseConnection();
  }
  return sequelize;
};

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const db = getDatabase();
    await db.authenticate();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

// Close database connection
export const closeDatabaseConnection = async (): Promise<void> => {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
    console.log('Database connection closed.');
  }
};

// Database health check
export const getDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> => {
  try {
    const startTime = Date.now();
    const db = getDatabase();
    await db.authenticate();
    const latency = Date.now() - startTime;
    
    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
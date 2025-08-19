/**
 * Main entry point for the E-commerce BI Dashboard backend
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import { testDatabaseConnection, getDatabaseHealth } from './config/database';
import { DatabaseHealthService } from './services/database-health.service';
import { syncDatabase } from './models';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || 
    Math.random().toString(36).substring(2, 15);
  next();
});

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await getDatabaseHealth();
    const healthService = DatabaseHealthService.getInstance();
    const healthStatus = await healthService.checkHealth();
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: dbHealth,
      detailed: healthStatus
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database health endpoint
app.get('/health/database', async (req, res) => {
  try {
    const healthService = DatabaseHealthService.getInstance();
    const health = await healthService.checkHealth();
    const stats = await healthService.getDatabaseStats();
    const performance = await healthService.testQueryPerformance();
    
    res.json({
      health,
      stats,
      performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred'
    }
  });
});

// Initialize database and start server
const initializeApp = async () => {
  try {
    // Test database connection
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Sync database models (create tables if they don't exist)
    if (process.env.NODE_ENV !== 'production') {
      await syncDatabase({ alter: true });
    }

    // Start database health monitoring
    const healthService = DatabaseHealthService.getInstance();
    healthService.startHealthChecks(30000); // Check every 30 seconds

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  initializeApp().then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  });
}

export default app;
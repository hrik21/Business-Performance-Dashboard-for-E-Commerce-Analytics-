/**
 * Error Handling and Retry Mechanism Service
 */

import { EventEmitter } from 'events';

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export interface ErrorContext {
  operation: string;
  timestamp: Date;
  attempt: number;
  maxAttempts: number;
  error: Error;
  metadata?: any;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

export class ErrorHandlerService extends EventEmitter {
  private retryConfigs: Map<string, RetryConfig> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private errorStats: Map<string, { count: number; lastOccurrence: Date }> = new Map();

  constructor() {
    super();
    this.initializeDefaultConfigs();
  }

  /**
   * Register retry configuration for a specific operation
   */
  registerRetryConfig(operationName: string, config: RetryConfig): void {
    this.retryConfigs.set(operationName, config);
  }

  /**
   * Execute an operation with retry logic
   */
  async executeWithRetry<T>(
    operationName: string,
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = {
      ...this.retryConfigs.get(operationName),
      ...customConfig,
    } as RetryConfig;

    if (!config) {
      throw new Error(`No retry configuration found for operation: ${operationName}`);
    }

    let lastError: Error;
    let attempt = 0;

    while (attempt <= config.maxRetries) {
      try {
        const result = await operation();
        
        // Reset error stats on success
        this.resetErrorStats(operationName);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Update error statistics
        this.updateErrorStats(operationName, lastError);

        const context: ErrorContext = {
          operation: operationName,
          timestamp: new Date(),
          attempt,
          maxAttempts: config.maxRetries + 1,
          error: lastError,
        };

        this.emit('operationFailed', context);

        // Check if error is retryable
        if (!this.isRetryableError(lastError, config)) {
          this.emit('nonRetryableError', context);
          throw lastError;
        }

        // Check if we've reached max retries
        if (attempt > config.maxRetries) {
          this.emit('maxRetriesReached', context);
          if (config.onMaxRetriesReached) {
            config.onMaxRetriesReached(lastError);
          }
          throw lastError;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(attempt, config);
        
        this.emit('retryAttempt', { ...context, delay });
        
        if (config.onRetry) {
          config.onRetry(attempt, lastError);
        }

        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Execute operation with circuit breaker pattern
   */
  async executeWithCircuitBreaker<T>(
    operationName: string,
    operation: () => Promise<T>,
    config: CircuitBreakerConfig
  ): Promise<T> {
    const state = this.getCircuitBreakerState(operationName, config);

    // Check if circuit is open
    if (state.state === 'open') {
      const now = new Date();
      if (state.nextAttemptTime && now < state.nextAttemptTime) {
        throw new Error(`Circuit breaker is open for ${operationName}. Next attempt at ${state.nextAttemptTime}`);
      } else {
        // Transition to half-open
        state.state = 'half-open';
        this.emit('circuitBreakerHalfOpen', { operation: operationName });
      }
    }

    try {
      const result = await operation();
      
      // Success - reset circuit breaker
      if (state.state === 'half-open') {
        state.state = 'closed';
        state.failureCount = 0;
        state.lastFailureTime = undefined;
        state.nextAttemptTime = undefined;
        this.emit('circuitBreakerClosed', { operation: operationName });
      }

      return result;
    } catch (error) {
      // Failure - update circuit breaker
      state.failureCount++;
      state.lastFailureTime = new Date();

      if (state.failureCount >= config.failureThreshold) {
        state.state = 'open';
        state.nextAttemptTime = new Date(Date.now() + config.resetTimeout);
        this.emit('circuitBreakerOpened', { 
          operation: operationName, 
          failureCount: state.failureCount 
        });
      }

      throw error;
    }
  }

  /**
   * Get error statistics for an operation
   */
  getErrorStats(operationName: string): { count: number; lastOccurrence?: Date } {
    const stats = this.errorStats.get(operationName);
    return {
      count: stats?.count || 0,
      lastOccurrence: stats?.lastOccurrence,
    };
  }

  /**
   * Get all error statistics
   */
  getAllErrorStats(): Record<string, { count: number; lastOccurrence?: Date }> {
    const allStats: Record<string, { count: number; lastOccurrence?: Date }> = {};
    
    for (const [operation, stats] of this.errorStats) {
      allStats[operation] = {
        count: stats.count,
        lastOccurrence: stats.lastOccurrence,
      };
    }

    return allStats;
  }

  /**
   * Get circuit breaker states
   */
  getCircuitBreakerStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    
    for (const [operation, state] of this.circuitBreakers) {
      states[operation] = { ...state };
    }

    return states;
  }

  /**
   * Reset error statistics for an operation
   */
  resetErrorStats(operationName: string): void {
    this.errorStats.delete(operationName);
  }

  /**
   * Reset circuit breaker for an operation
   */
  resetCircuitBreaker(operationName: string): void {
    const state = this.circuitBreakers.get(operationName);
    if (state) {
      state.state = 'closed';
      state.failureCount = 0;
      state.lastFailureTime = undefined;
      state.nextAttemptTime = undefined;
    }
  }

  /**
   * Create a standardized error response
   */
  createErrorResponse(error: Error, context?: any): {
    success: false;
    error: {
      code: string;
      message: string;
      details?: any;
      timestamp: string;
      context?: any;
    };
  } {
    return {
      success: false,
      error: {
        code: this.getErrorCode(error),
        message: error.message,
        details: this.getErrorDetails(error),
        timestamp: new Date().toISOString(),
        context,
      },
    };
  }

  // Private methods

  private initializeDefaultConfigs(): void {
    // Database operations
    this.registerRetryConfig('database', {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
    });

    // API calls
    this.registerRetryConfig('api', {
      maxRetries: 3,
      initialDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', '429', '502', '503', '504'],
    });

    // File operations
    this.registerRetryConfig('file', {
      maxRetries: 2,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 2,
      retryableErrors: ['EBUSY', 'EMFILE', 'ENFILE'],
    });

    // Stream operations
    this.registerRetryConfig('stream', {
      maxRetries: 5,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
    });
  }

  private isRetryableError(error: Error, config: RetryConfig): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorCode = (error as any).code;

    return config.retryableErrors.some(retryableError => {
      return errorMessage.includes(retryableError.toLowerCase()) ||
             errorCode === retryableError;
    });
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateErrorStats(operationName: string, error: Error): void {
    const stats = this.errorStats.get(operationName) || { count: 0, lastOccurrence: new Date() };
    stats.count++;
    stats.lastOccurrence = new Date();
    this.errorStats.set(operationName, stats);
  }

  private getCircuitBreakerState(operationName: string, config: CircuitBreakerConfig): CircuitBreakerState {
    if (!this.circuitBreakers.has(operationName)) {
      this.circuitBreakers.set(operationName, {
        state: 'closed',
        failureCount: 0,
      });
    }

    return this.circuitBreakers.get(operationName)!;
  }

  private getErrorCode(error: Error): string {
    // Extract error code from different error types
    if ((error as any).code) {
      return (error as any).code;
    }

    if (error.name) {
      return error.name;
    }

    // Default error codes based on error message patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('connection')) return 'CONNECTION_ERROR';
    if (message.includes('not found')) return 'NOT_FOUND';
    if (message.includes('permission')) return 'PERMISSION_DENIED';
    if (message.includes('validation')) return 'VALIDATION_ERROR';
    
    return 'UNKNOWN_ERROR';
  }

  private getErrorDetails(error: Error): any {
    const details: any = {};

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      details.stack = error.stack;
    }

    // Include additional error properties
    Object.keys(error).forEach(key => {
      if (key !== 'message' && key !== 'name' && key !== 'stack') {
        details[key] = (error as any)[key];
      }
    });

    return Object.keys(details).length > 0 ? details : undefined;
  }
}
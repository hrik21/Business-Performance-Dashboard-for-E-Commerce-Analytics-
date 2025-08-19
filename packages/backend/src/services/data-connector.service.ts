/**
 * Data Connector Service for multiple data source connections
 */

import { EventEmitter } from 'events';
import { Pool } from 'pg';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DataSourceConfig {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream';
  config: DatabaseConfig | ApiConfig | FileConfig | StreamConfig;
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
    token?: string;
  };
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  ssl?: boolean;
  connectionTimeout?: number;
  queryTimeout?: number;
}

export interface ApiConfig {
  baseUrl: string;
  endpoints: Record<string, string>;
  headers?: Record<string, string>;
  timeout?: number;
  rateLimit?: {
    requests: number;
    window: number; // in milliseconds
  };
}

export interface FileConfig {
  path: string;
  format: 'csv' | 'json' | 'xml' | 'excel';
  encoding?: string;
  delimiter?: string;
  hasHeader?: boolean;
}

export interface StreamConfig {
  url: string;
  protocol: 'websocket' | 'sse' | 'kafka';
  topic?: string;
  partition?: number;
}

export interface DataConnectorResult {
  success: boolean;
  data?: any[];
  error?: string;
  metadata?: {
    recordCount: number;
    executionTime: number;
    source: string;
  };
}

export class DataConnector extends EventEmitter {
  private connections: Map<string, any> = new Map();
  private rateLimiters: Map<string, { requests: number; resetTime: number }> = new Map();

  constructor() {
    super();
  }

  /**
   * Register a data source configuration
   */
  async registerDataSource(config: DataSourceConfig): Promise<void> {
    try {
      let connection;

      switch (config.type) {
        case 'database':
          connection = await this.createDatabaseConnection(config);
          break;
        case 'api':
          connection = this.createApiConnection(config);
          break;
        case 'file':
          connection = this.createFileConnection(config);
          break;
        case 'stream':
          connection = await this.createStreamConnection(config);
          break;
        default:
          throw new Error(`Unsupported data source type: ${config.type}`);
      }

      this.connections.set(config.id, {
        config,
        connection,
        lastUsed: new Date(),
        status: 'connected'
      });

      this.emit('dataSourceRegistered', config.id);
    } catch (error) {
      this.emit('error', {
        dataSourceId: config.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Extract data from a registered data source
   */
  async extractData(
    dataSourceId: string, 
    query: string | object,
    options: { limit?: number; offset?: number } = {}
  ): Promise<DataConnectorResult> {
    const startTime = Date.now();
    
    try {
      const dataSource = this.connections.get(dataSourceId);
      if (!dataSource) {
        throw new Error(`Data source ${dataSourceId} not found`);
      }

      // Check rate limiting for API sources
      if (dataSource.config.type === 'api') {
        await this.checkRateLimit(dataSourceId, dataSource.config);
      }

      let data: any[];

      switch (dataSource.config.type) {
        case 'database':
          data = await this.extractFromDatabase(dataSource, query as string, options);
          break;
        case 'api':
          data = await this.extractFromApi(dataSource, query as object, options);
          break;
        case 'file':
          data = await this.extractFromFile(dataSource, options);
          break;
        case 'stream':
          data = await this.extractFromStream(dataSource, options);
          break;
        default:
          throw new Error(`Unsupported extraction for type: ${dataSource.config.type}`);
      }

      const executionTime = Date.now() - startTime;
      
      // Update last used timestamp
      dataSource.lastUsed = new Date();

      const result: DataConnectorResult = {
        success: true,
        data,
        metadata: {
          recordCount: data.length,
          executionTime,
          source: dataSourceId
        }
      };

      this.emit('dataExtracted', result);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result: DataConnectorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          recordCount: 0,
          executionTime,
          source: dataSourceId
        }
      };

      this.emit('extractionError', result);
      return result;
    }
  }

  /**
   * Test connection to a data source
   */
  async testConnection(dataSourceId: string): Promise<boolean> {
    try {
      const dataSource = this.connections.get(dataSourceId);
      if (!dataSource) {
        return false;
      }

      switch (dataSource.config.type) {
        case 'database':
          const client = await dataSource.connection.connect();
          await client.query('SELECT 1');
          client.release();
          return true;
        case 'api':
          const response = await dataSource.connection.get('/health');
          return response.status === 200;
        case 'file':
          await fs.access(dataSource.config.config.path);
          return true;
        case 'stream':
          // For streams, we assume connection is valid if it was created successfully
          return dataSource.status === 'connected';
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get connection status for all data sources
   */
  getConnectionStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [id, dataSource] of this.connections) {
      status[id] = {
        name: dataSource.config.name,
        type: dataSource.config.type,
        status: dataSource.status,
        lastUsed: dataSource.lastUsed
      };
    }

    return status;
  }

  /**
   * Close all connections
   */
  async closeAllConnections(): Promise<void> {
    for (const [id, dataSource] of this.connections) {
      try {
        if (dataSource.config.type === 'database') {
          await dataSource.connection.end();
        }
        // Other connection types don't need explicit closing
      } catch (error) {
        console.error(`Error closing connection ${id}:`, error);
      }
    }
    
    this.connections.clear();
    this.emit('allConnectionsClosed');
  }

  // Private methods for creating connections

  private async createDatabaseConnection(config: DataSourceConfig): Promise<Pool> {
    const dbConfig = config.config as DatabaseConfig;
    
    const pool = new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: config.credentials?.username,
      password: config.credentials?.password,
      ssl: dbConfig.ssl,
      connectionTimeoutMillis: dbConfig.connectionTimeout || 5000,
      query_timeout: dbConfig.queryTimeout || 30000,
      max: 10,
      min: 1,
      idleTimeoutMillis: 30000,
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    return pool;
  }

  private createApiConnection(config: DataSourceConfig): AxiosInstance {
    const apiConfig = config.config as ApiConfig;
    
    const axiosConfig: AxiosRequestConfig = {
      baseURL: apiConfig.baseUrl,
      timeout: apiConfig.timeout || 30000,
      headers: {
        ...apiConfig.headers,
        ...(config.credentials?.apiKey && { 'X-API-Key': config.credentials.apiKey }),
        ...(config.credentials?.token && { 'Authorization': `Bearer ${config.credentials.token}` }),
      },
    };

    return axios.create(axiosConfig);
  }

  private createFileConnection(config: DataSourceConfig): object {
    const fileConfig = config.config as FileConfig;
    
    return {
      path: fileConfig.path,
      format: fileConfig.format,
      encoding: fileConfig.encoding || 'utf8',
      delimiter: fileConfig.delimiter || ',',
      hasHeader: fileConfig.hasHeader !== false,
    };
  }

  private async createStreamConnection(config: DataSourceConfig): Promise<object> {
    const streamConfig = config.config as StreamConfig;
    
    // For now, return a placeholder connection object
    // In a real implementation, this would establish WebSocket, SSE, or Kafka connections
    return {
      url: streamConfig.url,
      protocol: streamConfig.protocol,
      topic: streamConfig.topic,
      partition: streamConfig.partition,
      status: 'connected'
    };
  }

  // Private methods for data extraction

  private async extractFromDatabase(
    dataSource: any, 
    query: string, 
    options: { limit?: number; offset?: number }
  ): Promise<any[]> {
    const client = await dataSource.connection.connect();
    
    try {
      let finalQuery = query;
      
      if (options.limit) {
        finalQuery += ` LIMIT ${options.limit}`;
      }
      
      if (options.offset) {
        finalQuery += ` OFFSET ${options.offset}`;
      }

      const result = await client.query(finalQuery);
      return result.rows;
    } finally {
      client.release();
    }
  }

  private async extractFromApi(
    dataSource: any, 
    queryParams: object, 
    options: { limit?: number; offset?: number }
  ): Promise<any[]> {
    const params = {
      ...queryParams,
      ...(options.limit && { limit: options.limit }),
      ...(options.offset && { offset: options.offset }),
    };

    const response = await dataSource.connection.get('/data', { params });
    return Array.isArray(response.data) ? response.data : [response.data];
  }

  private async extractFromFile(
    dataSource: any, 
    options: { limit?: number; offset?: number }
  ): Promise<any[]> {
    const fileConfig = dataSource.connection;
    const content = await fs.readFile(fileConfig.path, { encoding: fileConfig.encoding as BufferEncoding });
    const contentStr = content.toString();
    
    let data: any[];

    switch (fileConfig.format) {
      case 'json':
        data = JSON.parse(contentStr);
        break;
      case 'csv':
        data = this.parseCsv(contentStr, fileConfig);
        break;
      default:
        throw new Error(`Unsupported file format: ${fileConfig.format}`);
    }

    // Apply pagination
    const start = options.offset || 0;
    const end = options.limit ? start + options.limit : undefined;
    
    return data.slice(start, end);
  }

  private async extractFromStream(
    dataSource: any, 
    options: { limit?: number; offset?: number }
  ): Promise<any[]> {
    // For now, return empty array
    // In a real implementation, this would read from the stream
    return [];
  }

  private parseCsv(content: string, config: any): any[] {
    const lines = content.split('\n').filter(line => line.trim());
    const delimiter = config.delimiter;
    
    let headers: string[] = [];
    let startIndex = 0;

    if (config.hasHeader && lines.length > 0) {
      headers = lines[0].split(delimiter).map(h => h.trim());
      startIndex = 1;
    }

    const data: any[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim());
      
      if (headers.length > 0) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || null;
        });
        data.push(row);
      } else {
        data.push(values);
      }
    }

    return data;
  }

  private async checkRateLimit(dataSourceId: string, config: DataSourceConfig): Promise<void> {
    const apiConfig = config.config as ApiConfig;
    
    if (!apiConfig.rateLimit) {
      return;
    }

    const now = Date.now();
    const rateLimiter = this.rateLimiters.get(dataSourceId);

    if (!rateLimiter || now > rateLimiter.resetTime) {
      this.rateLimiters.set(dataSourceId, {
        requests: 1,
        resetTime: now + apiConfig.rateLimit.window
      });
      return;
    }

    if (rateLimiter.requests >= apiConfig.rateLimit.requests) {
      const waitTime = rateLimiter.resetTime - now;
      throw new Error(`Rate limit exceeded. Wait ${waitTime}ms before next request.`);
    }

    rateLimiter.requests++;
  }
}
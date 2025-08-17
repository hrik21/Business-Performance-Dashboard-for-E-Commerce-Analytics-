/**
 * API contract interfaces for service communication
 * These interfaces define the structure of API requests and responses
 */

import { SalesMetric, CustomerBehavior, SupplyChainKPI, User, Permission } from './business-entities';

// Common API response structure
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ResponseMetadata {
  timestamp: Date;
  requestId: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Sales Analytics API Contracts
export interface SalesMetricsRequest {
  startDate: Date;
  endDate: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
  filters?: {
    productCategory?: string[];
    region?: string[];
    channel?: string[];
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SalesMetricsResponse extends ApiResponse<SalesMetric[]> {
  metadata: ResponseMetadata & {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
}

// Customer Behavior API Contracts
export interface CustomerBehaviorRequest {
  customerId?: string;
  segmentId?: string;
  startDate?: Date;
  endDate?: Date;
  includeChurnRisk?: boolean;
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface CustomerBehaviorResponse extends ApiResponse<CustomerBehavior[]> {
  metadata: ResponseMetadata & {
    totalCustomers: number;
    averageLifetimeValue: number;
    churnRate: number;
  };
}

// Supply Chain API Contracts
export interface SupplyChainKPIRequest {
  productIds?: string[];
  warehouseLocation?: string;
  stockoutRiskLevel?: 'low' | 'medium' | 'high';
  includeReorderRecommendations?: boolean;
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SupplyChainKPIResponse extends ApiResponse<SupplyChainKPI[]> {
  metadata: ResponseMetadata & {
    totalProducts: number;
    lowStockCount: number;
    averageFulfillmentRate: number;
    reorderRecommendations?: ReorderRecommendation[];
  };
}

export interface ReorderRecommendation {
  productId: string;
  recommendedQuantity: number;
  urgency: 'low' | 'medium' | 'high';
  estimatedStockoutDate: Date;
}

// Authentication API Contracts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse extends ApiResponse<{
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse extends ApiResponse<{
  accessToken: string;
  expiresIn: number;
}> {}

// Real-time WebSocket Events
export interface WebSocketEvent<T = any> {
  type: string;
  data: T;
  timestamp: Date;
  userId?: string;
}

export interface SalesUpdateEvent extends WebSocketEvent<SalesMetric> {
  type: 'sales_update';
}

export interface CustomerBehaviorUpdateEvent extends WebSocketEvent<CustomerBehavior> {
  type: 'customer_behavior_update';
}

export interface SupplyChainAlertEvent extends WebSocketEvent<{
  productId: string;
  alertType: 'low_stock' | 'stockout' | 'supplier_delay';
  severity: 'low' | 'medium' | 'high';
  message: string;
}> {
  type: 'supply_chain_alert';
}

// Dashboard API Contracts
export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  visualizations: Visualization[];
  filters: Filter[];
  refreshInterval: number;
  isPublic: boolean;
  permissions: Permission[];
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  widgets: WidgetPosition[];
}

export interface WidgetPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Visualization {
  id: string;
  type: 'chart' | 'table' | 'kpi' | 'powerbi';
  title: string;
  dataSource: string;
  config: VisualizationConfig;
}

export interface VisualizationConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'area';
  xAxis?: string;
  yAxis?: string[];
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  filters?: Filter[];
  powerBIConfig?: PowerBIConfig;
}

export interface PowerBIConfig {
  reportId: string;
  workspaceId: string;
  embedUrl: string;
  datasetId: string;
}

export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains';
  value: any;
  label?: string;
}
/**
 * Data validation schemas using Zod
 * These schemas ensure data integrity and type safety
 */

import { z } from 'zod';

// Base schemas
export const TimePeriodSchema = z.object({
  start: z.date(),
  end: z.date(),
  granularity: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']),
});

export const PaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(1000),
});

// Business Entity Schemas
export const SalesMetricSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.date(),
  revenue: z.number().min(0),
  orderCount: z.number().int().min(0),
  averageOrderValue: z.number().min(0),
  conversionRate: z.number().min(0).max(1),
  period: TimePeriodSchema,
  productCategory: z.string().optional(),
  region: z.string().optional(),
  channel: z.string().optional(),
});

export const CustomerBehaviorSchema = z.object({
  customerId: z.string().uuid(),
  sessionId: z.string(),
  pageViews: z.number().int().min(0),
  timeOnSite: z.number().min(0),
  purchaseIntent: z.number().min(0).max(1),
  segmentId: z.string(),
  lifetimeValue: z.number().min(0),
  lastActivity: z.date(),
  acquisitionChannel: z.string(),
  churnRisk: z.number().min(0).max(1),
  averageOrderValue: z.number().min(0),
  purchaseFrequency: z.number().min(0),
});

export const SupplyChainKPISchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1),
  currentStock: z.number().int().min(0),
  reorderPoint: z.number().int().min(0),
  leadTime: z.number().int().min(0),
  supplierPerformance: z.number().min(0).max(1),
  fulfillmentRate: z.number().min(0).max(1),
  lastUpdated: z.date(),
  supplierId: z.string().uuid(),
  warehouseLocation: z.string(),
  stockoutRisk: z.enum(['low', 'medium', 'high']),
  averageDemand: z.number().min(0),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    permissions: z.array(z.object({
      id: z.string().uuid(),
      resource: z.string(),
      action: z.enum(['read', 'write', 'delete', 'admin']),
      scope: z.string().optional(),
    })),
  }),
  permissions: z.array(z.object({
    id: z.string().uuid(),
    resource: z.string(),
    action: z.enum(['read', 'write', 'delete', 'admin']),
    scope: z.string().optional(),
  })),
  createdAt: z.date(),
  lastLogin: z.date().optional(),
  isActive: z.boolean(),
});

// API Request Schemas
export const SalesMetricsRequestSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  granularity: z.enum(['hour', 'day', 'week', 'month']),
  filters: z.object({
    productCategory: z.array(z.string()).optional(),
    region: z.array(z.string()).optional(),
    channel: z.array(z.string()).optional(),
  }).optional(),
  pagination: PaginationSchema.optional(),
});

export const CustomerBehaviorRequestSchema = z.object({
  customerId: z.string().uuid().optional(),
  segmentId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  includeChurnRisk: z.boolean().optional(),
  pagination: PaginationSchema.optional(),
});

export const SupplyChainKPIRequestSchema = z.object({
  productIds: z.array(z.string().uuid()).optional(),
  warehouseLocation: z.string().optional(),
  stockoutRiskLevel: z.enum(['low', 'medium', 'high']).optional(),
  includeReorderRecommendations: z.boolean().optional(),
  pagination: PaginationSchema.optional(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

// Dashboard Configuration Schemas
export const FilterSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains']),
  value: z.any(),
  label: z.string().optional(),
});

export const VisualizationConfigSchema = z.object({
  chartType: z.enum(['line', 'bar', 'pie', 'scatter', 'area']).optional(),
  xAxis: z.string().optional(),
  yAxis: z.array(z.string()).optional(),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
  filters: z.array(FilterSchema).optional(),
  powerBIConfig: z.object({
    reportId: z.string(),
    workspaceId: z.string(),
    embedUrl: z.string().url(),
    datasetId: z.string(),
  }).optional(),
});

export const VisualizationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['chart', 'table', 'kpi', 'powerbi']),
  title: z.string().min(1),
  dataSource: z.string(),
  config: VisualizationConfigSchema,
});

export const DashboardConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  layout: z.object({
    columns: z.number().int().min(1).max(12),
    rows: z.number().int().min(1),
    widgets: z.array(z.object({
      id: z.string().uuid(),
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      width: z.number().int().min(1),
      height: z.number().int().min(1),
    })),
  }),
  visualizations: z.array(VisualizationSchema),
  filters: z.array(FilterSchema),
  refreshInterval: z.number().int().min(5).max(3600), // 5 seconds to 1 hour
  isPublic: z.boolean(),
  permissions: z.array(z.object({
    id: z.string().uuid(),
    resource: z.string(),
    action: z.enum(['read', 'write', 'delete', 'admin']),
    scope: z.string().optional(),
  })),
});

// WebSocket Event Schemas
export const WebSocketEventSchema = z.object({
  type: z.string(),
  data: z.any(),
  timestamp: z.date(),
  userId: z.string().uuid().optional(),
});

export const SalesUpdateEventSchema = WebSocketEventSchema.extend({
  type: z.literal('sales_update'),
  data: SalesMetricSchema,
});

export const CustomerBehaviorUpdateEventSchema = WebSocketEventSchema.extend({
  type: z.literal('customer_behavior_update'),
  data: CustomerBehaviorSchema,
});

export const SupplyChainAlertEventSchema = WebSocketEventSchema.extend({
  type: z.literal('supply_chain_alert'),
  data: z.object({
    productId: z.string().uuid(),
    alertType: z.enum(['low_stock', 'stockout', 'supplier_delay']),
    severity: z.enum(['low', 'medium', 'high']),
    message: z.string(),
  }),
});

// Validation helper functions
export const validateSalesMetric = (data: unknown) => SalesMetricSchema.parse(data);
export const validateCustomerBehavior = (data: unknown) => CustomerBehaviorSchema.parse(data);
export const validateSupplyChainKPI = (data: unknown) => SupplyChainKPISchema.parse(data);
export const validateUser = (data: unknown) => UserSchema.parse(data);
export const validateDashboardConfig = (data: unknown) => DashboardConfigSchema.parse(data);

// Safe validation functions that return results instead of throwing
export const safeParseSalesMetric = (data: unknown) => SalesMetricSchema.safeParse(data);
export const safeParseCustomerBehavior = (data: unknown) => CustomerBehaviorSchema.safeParse(data);
export const safeParseSupplyChainKPI = (data: unknown) => SupplyChainKPISchema.safeParse(data);
export const safeParseUser = (data: unknown) => UserSchema.safeParse(data);
export const safeParseDashboardConfig = (data: unknown) => DashboardConfigSchema.safeParse(data);
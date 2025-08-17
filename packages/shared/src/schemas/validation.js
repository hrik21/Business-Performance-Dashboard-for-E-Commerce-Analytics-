"use strict";
/**
 * Data validation schemas using Zod
 * These schemas ensure data integrity and type safety
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeParseDashboardConfig = exports.safeParseUser = exports.safeParseSupplyChainKPI = exports.safeParseCustomerBehavior = exports.safeParseSalesMetric = exports.validateDashboardConfig = exports.validateUser = exports.validateSupplyChainKPI = exports.validateCustomerBehavior = exports.validateSalesMetric = exports.SupplyChainAlertEventSchema = exports.CustomerBehaviorUpdateEventSchema = exports.SalesUpdateEventSchema = exports.WebSocketEventSchema = exports.DashboardConfigSchema = exports.VisualizationSchema = exports.VisualizationConfigSchema = exports.FilterSchema = exports.RefreshTokenRequestSchema = exports.LoginRequestSchema = exports.SupplyChainKPIRequestSchema = exports.CustomerBehaviorRequestSchema = exports.SalesMetricsRequestSchema = exports.UserSchema = exports.SupplyChainKPISchema = exports.CustomerBehaviorSchema = exports.SalesMetricSchema = exports.PaginationSchema = exports.TimePeriodSchema = void 0;
const zod_1 = require("zod");
// Base schemas
exports.TimePeriodSchema = zod_1.z.object({
    start: zod_1.z.date(),
    end: zod_1.z.date(),
    granularity: zod_1.z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']),
});
exports.PaginationSchema = zod_1.z.object({
    page: zod_1.z.number().min(1),
    limit: zod_1.z.number().min(1).max(1000),
});
// Business Entity Schemas
exports.SalesMetricSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    timestamp: zod_1.z.date(),
    revenue: zod_1.z.number().min(0),
    orderCount: zod_1.z.number().int().min(0),
    averageOrderValue: zod_1.z.number().min(0),
    conversionRate: zod_1.z.number().min(0).max(1),
    period: exports.TimePeriodSchema,
    productCategory: zod_1.z.string().optional(),
    region: zod_1.z.string().optional(),
    channel: zod_1.z.string().optional(),
});
exports.CustomerBehaviorSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    sessionId: zod_1.z.string(),
    pageViews: zod_1.z.number().int().min(0),
    timeOnSite: zod_1.z.number().min(0),
    purchaseIntent: zod_1.z.number().min(0).max(1),
    segmentId: zod_1.z.string(),
    lifetimeValue: zod_1.z.number().min(0),
    lastActivity: zod_1.z.date(),
    acquisitionChannel: zod_1.z.string(),
    churnRisk: zod_1.z.number().min(0).max(1),
    averageOrderValue: zod_1.z.number().min(0),
    purchaseFrequency: zod_1.z.number().min(0),
});
exports.SupplyChainKPISchema = zod_1.z.object({
    productId: zod_1.z.string().uuid(),
    productName: zod_1.z.string().min(1),
    currentStock: zod_1.z.number().int().min(0),
    reorderPoint: zod_1.z.number().int().min(0),
    leadTime: zod_1.z.number().int().min(0),
    supplierPerformance: zod_1.z.number().min(0).max(1),
    fulfillmentRate: zod_1.z.number().min(0).max(1),
    lastUpdated: zod_1.z.date(),
    supplierId: zod_1.z.string().uuid(),
    warehouseLocation: zod_1.z.string(),
    stockoutRisk: zod_1.z.enum(['low', 'medium', 'high']),
    averageDemand: zod_1.z.number().min(0),
});
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    role: zod_1.z.object({
        id: zod_1.z.string().uuid(),
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        permissions: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string().uuid(),
            resource: zod_1.z.string(),
            action: zod_1.z.enum(['read', 'write', 'delete', 'admin']),
            scope: zod_1.z.string().optional(),
        })),
    }),
    permissions: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        resource: zod_1.z.string(),
        action: zod_1.z.enum(['read', 'write', 'delete', 'admin']),
        scope: zod_1.z.string().optional(),
    })),
    createdAt: zod_1.z.date(),
    lastLogin: zod_1.z.date().optional(),
    isActive: zod_1.z.boolean(),
});
// API Request Schemas
exports.SalesMetricsRequestSchema = zod_1.z.object({
    startDate: zod_1.z.date(),
    endDate: zod_1.z.date(),
    granularity: zod_1.z.enum(['hour', 'day', 'week', 'month']),
    filters: zod_1.z.object({
        productCategory: zod_1.z.array(zod_1.z.string()).optional(),
        region: zod_1.z.array(zod_1.z.string()).optional(),
        channel: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
    pagination: exports.PaginationSchema.optional(),
});
exports.CustomerBehaviorRequestSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid().optional(),
    segmentId: zod_1.z.string().optional(),
    startDate: zod_1.z.date().optional(),
    endDate: zod_1.z.date().optional(),
    includeChurnRisk: zod_1.z.boolean().optional(),
    pagination: exports.PaginationSchema.optional(),
});
exports.SupplyChainKPIRequestSchema = zod_1.z.object({
    productIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    warehouseLocation: zod_1.z.string().optional(),
    stockoutRiskLevel: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    includeReorderRecommendations: zod_1.z.boolean().optional(),
    pagination: exports.PaginationSchema.optional(),
});
exports.LoginRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
});
exports.RefreshTokenRequestSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
// Dashboard Configuration Schemas
exports.FilterSchema = zod_1.z.object({
    field: zod_1.z.string(),
    operator: zod_1.z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains']),
    value: zod_1.z.any(),
    label: zod_1.z.string().optional(),
});
exports.VisualizationConfigSchema = zod_1.z.object({
    chartType: zod_1.z.enum(['line', 'bar', 'pie', 'scatter', 'area']).optional(),
    xAxis: zod_1.z.string().optional(),
    yAxis: zod_1.z.array(zod_1.z.string()).optional(),
    aggregation: zod_1.z.enum(['sum', 'avg', 'count', 'min', 'max']).optional(),
    filters: zod_1.z.array(exports.FilterSchema).optional(),
    powerBIConfig: zod_1.z.object({
        reportId: zod_1.z.string(),
        workspaceId: zod_1.z.string(),
        embedUrl: zod_1.z.string().url(),
        datasetId: zod_1.z.string(),
    }).optional(),
});
exports.VisualizationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['chart', 'table', 'kpi', 'powerbi']),
    title: zod_1.z.string().min(1),
    dataSource: zod_1.z.string(),
    config: exports.VisualizationConfigSchema,
});
exports.DashboardConfigSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    layout: zod_1.z.object({
        columns: zod_1.z.number().int().min(1).max(12),
        rows: zod_1.z.number().int().min(1),
        widgets: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string().uuid(),
            x: zod_1.z.number().int().min(0),
            y: zod_1.z.number().int().min(0),
            width: zod_1.z.number().int().min(1),
            height: zod_1.z.number().int().min(1),
        })),
    }),
    visualizations: zod_1.z.array(exports.VisualizationSchema),
    filters: zod_1.z.array(exports.FilterSchema),
    refreshInterval: zod_1.z.number().int().min(5).max(3600), // 5 seconds to 1 hour
    isPublic: zod_1.z.boolean(),
    permissions: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        resource: zod_1.z.string(),
        action: zod_1.z.enum(['read', 'write', 'delete', 'admin']),
        scope: zod_1.z.string().optional(),
    })),
});
// WebSocket Event Schemas
exports.WebSocketEventSchema = zod_1.z.object({
    type: zod_1.z.string(),
    data: zod_1.z.any(),
    timestamp: zod_1.z.date(),
    userId: zod_1.z.string().uuid().optional(),
});
exports.SalesUpdateEventSchema = exports.WebSocketEventSchema.extend({
    type: zod_1.z.literal('sales_update'),
    data: exports.SalesMetricSchema,
});
exports.CustomerBehaviorUpdateEventSchema = exports.WebSocketEventSchema.extend({
    type: zod_1.z.literal('customer_behavior_update'),
    data: exports.CustomerBehaviorSchema,
});
exports.SupplyChainAlertEventSchema = exports.WebSocketEventSchema.extend({
    type: zod_1.z.literal('supply_chain_alert'),
    data: zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        alertType: zod_1.z.enum(['low_stock', 'stockout', 'supplier_delay']),
        severity: zod_1.z.enum(['low', 'medium', 'high']),
        message: zod_1.z.string(),
    }),
});
// Validation helper functions
const validateSalesMetric = (data) => exports.SalesMetricSchema.parse(data);
exports.validateSalesMetric = validateSalesMetric;
const validateCustomerBehavior = (data) => exports.CustomerBehaviorSchema.parse(data);
exports.validateCustomerBehavior = validateCustomerBehavior;
const validateSupplyChainKPI = (data) => exports.SupplyChainKPISchema.parse(data);
exports.validateSupplyChainKPI = validateSupplyChainKPI;
const validateUser = (data) => exports.UserSchema.parse(data);
exports.validateUser = validateUser;
const validateDashboardConfig = (data) => exports.DashboardConfigSchema.parse(data);
exports.validateDashboardConfig = validateDashboardConfig;
// Safe validation functions that return results instead of throwing
const safeParseSalesMetric = (data) => exports.SalesMetricSchema.safeParse(data);
exports.safeParseSalesMetric = safeParseSalesMetric;
const safeParseCustomerBehavior = (data) => exports.CustomerBehaviorSchema.safeParse(data);
exports.safeParseCustomerBehavior = safeParseCustomerBehavior;
const safeParseSupplyChainKPI = (data) => exports.SupplyChainKPISchema.safeParse(data);
exports.safeParseSupplyChainKPI = safeParseSupplyChainKPI;
const safeParseUser = (data) => exports.UserSchema.safeParse(data);
exports.safeParseUser = safeParseUser;
const safeParseDashboardConfig = (data) => exports.DashboardConfigSchema.safeParse(data);
exports.safeParseDashboardConfig = safeParseDashboardConfig;

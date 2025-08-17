/**
 * Data validation schemas using Zod
 * These schemas ensure data integrity and type safety
 */
import { z } from 'zod';
export declare const TimePeriodSchema: z.ZodObject<{
    start: z.ZodDate;
    end: z.ZodDate;
    granularity: z.ZodEnum<["hour", "day", "week", "month", "quarter", "year"]>;
}, "strip", z.ZodTypeAny, {
    start: Date;
    end: Date;
    granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
}, {
    start: Date;
    end: Date;
    granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page: number;
    limit: number;
}>;
export declare const SalesMetricSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodDate;
    revenue: z.ZodNumber;
    orderCount: z.ZodNumber;
    averageOrderValue: z.ZodNumber;
    conversionRate: z.ZodNumber;
    period: z.ZodObject<{
        start: z.ZodDate;
        end: z.ZodDate;
        granularity: z.ZodEnum<["hour", "day", "week", "month", "quarter", "year"]>;
    }, "strip", z.ZodTypeAny, {
        start: Date;
        end: Date;
        granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
    }, {
        start: Date;
        end: Date;
        granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
    }>;
    productCategory: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    channel: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    timestamp: Date;
    revenue: number;
    orderCount: number;
    averageOrderValue: number;
    conversionRate: number;
    period: {
        start: Date;
        end: Date;
        granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
    };
    productCategory?: string | undefined;
    region?: string | undefined;
    channel?: string | undefined;
}, {
    id: string;
    timestamp: Date;
    revenue: number;
    orderCount: number;
    averageOrderValue: number;
    conversionRate: number;
    period: {
        start: Date;
        end: Date;
        granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
    };
    productCategory?: string | undefined;
    region?: string | undefined;
    channel?: string | undefined;
}>;
export declare const CustomerBehaviorSchema: z.ZodObject<{
    customerId: z.ZodString;
    sessionId: z.ZodString;
    pageViews: z.ZodNumber;
    timeOnSite: z.ZodNumber;
    purchaseIntent: z.ZodNumber;
    segmentId: z.ZodString;
    lifetimeValue: z.ZodNumber;
    lastActivity: z.ZodDate;
    acquisitionChannel: z.ZodString;
    churnRisk: z.ZodNumber;
    averageOrderValue: z.ZodNumber;
    purchaseFrequency: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    averageOrderValue: number;
    customerId: string;
    sessionId: string;
    pageViews: number;
    timeOnSite: number;
    purchaseIntent: number;
    segmentId: string;
    lifetimeValue: number;
    lastActivity: Date;
    acquisitionChannel: string;
    churnRisk: number;
    purchaseFrequency: number;
}, {
    averageOrderValue: number;
    customerId: string;
    sessionId: string;
    pageViews: number;
    timeOnSite: number;
    purchaseIntent: number;
    segmentId: string;
    lifetimeValue: number;
    lastActivity: Date;
    acquisitionChannel: string;
    churnRisk: number;
    purchaseFrequency: number;
}>;
export declare const SupplyChainKPISchema: z.ZodObject<{
    productId: z.ZodString;
    productName: z.ZodString;
    currentStock: z.ZodNumber;
    reorderPoint: z.ZodNumber;
    leadTime: z.ZodNumber;
    supplierPerformance: z.ZodNumber;
    fulfillmentRate: z.ZodNumber;
    lastUpdated: z.ZodDate;
    supplierId: z.ZodString;
    warehouseLocation: z.ZodString;
    stockoutRisk: z.ZodEnum<["low", "medium", "high"]>;
    averageDemand: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    leadTime: number;
    supplierPerformance: number;
    fulfillmentRate: number;
    lastUpdated: Date;
    supplierId: string;
    warehouseLocation: string;
    stockoutRisk: "low" | "medium" | "high";
    averageDemand: number;
}, {
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    leadTime: number;
    supplierPerformance: number;
    fulfillmentRate: number;
    lastUpdated: Date;
    supplierId: string;
    warehouseLocation: string;
    stockoutRisk: "low" | "medium" | "high";
    averageDemand: number;
}>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodString;
        permissions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            resource: z.ZodString;
            action: z.ZodEnum<["read", "write", "delete", "admin"]>;
            scope: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            resource: string;
            action: "read" | "write" | "delete" | "admin";
            scope?: string | undefined;
        }, {
            id: string;
            resource: string;
            action: "read" | "write" | "delete" | "admin";
            scope?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        description: string;
        permissions: {
            id: string;
            resource: string;
            action: "read" | "write" | "delete" | "admin";
            scope?: string | undefined;
        }[];
    }, {
        id: string;
        name: string;
        description: string;
        permissions: {
            id: string;
            resource: string;
            action: "read" | "write" | "delete" | "admin";
            scope?: string | undefined;
        }[];
    }>;
    permissions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        resource: z.ZodString;
        action: z.ZodEnum<["read", "write", "delete", "admin"]>;
        scope: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }, {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }>, "many">;
    createdAt: z.ZodDate;
    lastLogin: z.ZodOptional<z.ZodDate>;
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
        id: string;
        name: string;
        description: string;
        permissions: {
            id: string;
            resource: string;
            action: "read" | "write" | "delete" | "admin";
            scope?: string | undefined;
        }[];
    };
    permissions: {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }[];
    createdAt: Date;
    isActive: boolean;
    lastLogin?: Date | undefined;
}, {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
        id: string;
        name: string;
        description: string;
        permissions: {
            id: string;
            resource: string;
            action: "read" | "write" | "delete" | "admin";
            scope?: string | undefined;
        }[];
    };
    permissions: {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }[];
    createdAt: Date;
    isActive: boolean;
    lastLogin?: Date | undefined;
}>;
export declare const SalesMetricsRequestSchema: z.ZodObject<{
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    granularity: z.ZodEnum<["hour", "day", "week", "month"]>;
    filters: z.ZodOptional<z.ZodObject<{
        productCategory: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        region: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        channel: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        productCategory?: string[] | undefined;
        region?: string[] | undefined;
        channel?: string[] | undefined;
    }, {
        productCategory?: string[] | undefined;
        region?: string[] | undefined;
        channel?: string[] | undefined;
    }>>;
    pagination: z.ZodOptional<z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
    }, {
        page: number;
        limit: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    granularity: "hour" | "day" | "week" | "month";
    startDate: Date;
    endDate: Date;
    filters?: {
        productCategory?: string[] | undefined;
        region?: string[] | undefined;
        channel?: string[] | undefined;
    } | undefined;
    pagination?: {
        page: number;
        limit: number;
    } | undefined;
}, {
    granularity: "hour" | "day" | "week" | "month";
    startDate: Date;
    endDate: Date;
    filters?: {
        productCategory?: string[] | undefined;
        region?: string[] | undefined;
        channel?: string[] | undefined;
    } | undefined;
    pagination?: {
        page: number;
        limit: number;
    } | undefined;
}>;
export declare const CustomerBehaviorRequestSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    segmentId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodDate>;
    endDate: z.ZodOptional<z.ZodDate>;
    includeChurnRisk: z.ZodOptional<z.ZodBoolean>;
    pagination: z.ZodOptional<z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
    }, {
        page: number;
        limit: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    customerId?: string | undefined;
    segmentId?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    pagination?: {
        page: number;
        limit: number;
    } | undefined;
    includeChurnRisk?: boolean | undefined;
}, {
    customerId?: string | undefined;
    segmentId?: string | undefined;
    startDate?: Date | undefined;
    endDate?: Date | undefined;
    pagination?: {
        page: number;
        limit: number;
    } | undefined;
    includeChurnRisk?: boolean | undefined;
}>;
export declare const SupplyChainKPIRequestSchema: z.ZodObject<{
    productIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    warehouseLocation: z.ZodOptional<z.ZodString>;
    stockoutRiskLevel: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    includeReorderRecommendations: z.ZodOptional<z.ZodBoolean>;
    pagination: z.ZodOptional<z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
    }, {
        page: number;
        limit: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    warehouseLocation?: string | undefined;
    pagination?: {
        page: number;
        limit: number;
    } | undefined;
    productIds?: string[] | undefined;
    stockoutRiskLevel?: "low" | "medium" | "high" | undefined;
    includeReorderRecommendations?: boolean | undefined;
}, {
    warehouseLocation?: string | undefined;
    pagination?: {
        page: number;
        limit: number;
    } | undefined;
    productIds?: string[] | undefined;
    stockoutRiskLevel?: "low" | "medium" | "high" | undefined;
    includeReorderRecommendations?: boolean | undefined;
}>;
export declare const LoginRequestSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RefreshTokenRequestSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const FilterSchema: z.ZodObject<{
    field: z.ZodString;
    operator: z.ZodEnum<["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains"]>;
    value: z.ZodAny;
    label: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    field: string;
    operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
    value?: any;
    label?: string | undefined;
}, {
    field: string;
    operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
    value?: any;
    label?: string | undefined;
}>;
export declare const VisualizationConfigSchema: z.ZodObject<{
    chartType: z.ZodOptional<z.ZodEnum<["line", "bar", "pie", "scatter", "area"]>>;
    xAxis: z.ZodOptional<z.ZodString>;
    yAxis: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    aggregation: z.ZodOptional<z.ZodEnum<["sum", "avg", "count", "min", "max"]>>;
    filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains"]>;
        value: z.ZodAny;
        label: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
        value?: any;
        label?: string | undefined;
    }, {
        field: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
        value?: any;
        label?: string | undefined;
    }>, "many">>;
    powerBIConfig: z.ZodOptional<z.ZodObject<{
        reportId: z.ZodString;
        workspaceId: z.ZodString;
        embedUrl: z.ZodString;
        datasetId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        reportId: string;
        workspaceId: string;
        embedUrl: string;
        datasetId: string;
    }, {
        reportId: string;
        workspaceId: string;
        embedUrl: string;
        datasetId: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    filters?: {
        field: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
        value?: any;
        label?: string | undefined;
    }[] | undefined;
    chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
    xAxis?: string | undefined;
    yAxis?: string[] | undefined;
    aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
    powerBIConfig?: {
        reportId: string;
        workspaceId: string;
        embedUrl: string;
        datasetId: string;
    } | undefined;
}, {
    filters?: {
        field: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
        value?: any;
        label?: string | undefined;
    }[] | undefined;
    chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
    xAxis?: string | undefined;
    yAxis?: string[] | undefined;
    aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
    powerBIConfig?: {
        reportId: string;
        workspaceId: string;
        embedUrl: string;
        datasetId: string;
    } | undefined;
}>;
export declare const VisualizationSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["chart", "table", "kpi", "powerbi"]>;
    title: z.ZodString;
    dataSource: z.ZodString;
    config: z.ZodObject<{
        chartType: z.ZodOptional<z.ZodEnum<["line", "bar", "pie", "scatter", "area"]>>;
        xAxis: z.ZodOptional<z.ZodString>;
        yAxis: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        aggregation: z.ZodOptional<z.ZodEnum<["sum", "avg", "count", "min", "max"]>>;
        filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
            field: z.ZodString;
            operator: z.ZodEnum<["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains"]>;
            value: z.ZodAny;
            label: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            field: string;
            operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
            value?: any;
            label?: string | undefined;
        }, {
            field: string;
            operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
            value?: any;
            label?: string | undefined;
        }>, "many">>;
        powerBIConfig: z.ZodOptional<z.ZodObject<{
            reportId: z.ZodString;
            workspaceId: z.ZodString;
            embedUrl: z.ZodString;
            datasetId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            reportId: string;
            workspaceId: string;
            embedUrl: string;
            datasetId: string;
        }, {
            reportId: string;
            workspaceId: string;
            embedUrl: string;
            datasetId: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        filters?: {
            field: string;
            operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
            value?: any;
            label?: string | undefined;
        }[] | undefined;
        chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
        xAxis?: string | undefined;
        yAxis?: string[] | undefined;
        aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
        powerBIConfig?: {
            reportId: string;
            workspaceId: string;
            embedUrl: string;
            datasetId: string;
        } | undefined;
    }, {
        filters?: {
            field: string;
            operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
            value?: any;
            label?: string | undefined;
        }[] | undefined;
        chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
        xAxis?: string | undefined;
        yAxis?: string[] | undefined;
        aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
        powerBIConfig?: {
            reportId: string;
            workspaceId: string;
            embedUrl: string;
            datasetId: string;
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "chart" | "table" | "kpi" | "powerbi";
    id: string;
    title: string;
    dataSource: string;
    config: {
        filters?: {
            field: string;
            operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
            value?: any;
            label?: string | undefined;
        }[] | undefined;
        chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
        xAxis?: string | undefined;
        yAxis?: string[] | undefined;
        aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
        powerBIConfig?: {
            reportId: string;
            workspaceId: string;
            embedUrl: string;
            datasetId: string;
        } | undefined;
    };
}, {
    type: "chart" | "table" | "kpi" | "powerbi";
    id: string;
    title: string;
    dataSource: string;
    config: {
        filters?: {
            field: string;
            operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
            value?: any;
            label?: string | undefined;
        }[] | undefined;
        chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
        xAxis?: string | undefined;
        yAxis?: string[] | undefined;
        aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
        powerBIConfig?: {
            reportId: string;
            workspaceId: string;
            embedUrl: string;
            datasetId: string;
        } | undefined;
    };
}>;
export declare const DashboardConfigSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    layout: z.ZodObject<{
        columns: z.ZodNumber;
        rows: z.ZodNumber;
        widgets: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }, {
            id: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        columns: number;
        rows: number;
        widgets: {
            id: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }[];
    }, {
        columns: number;
        rows: number;
        widgets: {
            id: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }[];
    }>;
    visualizations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["chart", "table", "kpi", "powerbi"]>;
        title: z.ZodString;
        dataSource: z.ZodString;
        config: z.ZodObject<{
            chartType: z.ZodOptional<z.ZodEnum<["line", "bar", "pie", "scatter", "area"]>>;
            xAxis: z.ZodOptional<z.ZodString>;
            yAxis: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            aggregation: z.ZodOptional<z.ZodEnum<["sum", "avg", "count", "min", "max"]>>;
            filters: z.ZodOptional<z.ZodArray<z.ZodObject<{
                field: z.ZodString;
                operator: z.ZodEnum<["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains"]>;
                value: z.ZodAny;
                label: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                field: string;
                operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
                value?: any;
                label?: string | undefined;
            }, {
                field: string;
                operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
                value?: any;
                label?: string | undefined;
            }>, "many">>;
            powerBIConfig: z.ZodOptional<z.ZodObject<{
                reportId: z.ZodString;
                workspaceId: z.ZodString;
                embedUrl: z.ZodString;
                datasetId: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                reportId: string;
                workspaceId: string;
                embedUrl: string;
                datasetId: string;
            }, {
                reportId: string;
                workspaceId: string;
                embedUrl: string;
                datasetId: string;
            }>>;
        }, "strip", z.ZodTypeAny, {
            filters?: {
                field: string;
                operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
                value?: any;
                label?: string | undefined;
            }[] | undefined;
            chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
            xAxis?: string | undefined;
            yAxis?: string[] | undefined;
            aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
            powerBIConfig?: {
                reportId: string;
                workspaceId: string;
                embedUrl: string;
                datasetId: string;
            } | undefined;
        }, {
            filters?: {
                field: string;
                operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
                value?: any;
                label?: string | undefined;
            }[] | undefined;
            chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
            xAxis?: string | undefined;
            yAxis?: string[] | undefined;
            aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
            powerBIConfig?: {
                reportId: string;
                workspaceId: string;
                embedUrl: string;
                datasetId: string;
            } | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        type: "chart" | "table" | "kpi" | "powerbi";
        id: string;
        title: string;
        dataSource: string;
        config: {
            filters?: {
                field: string;
                operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
                value?: any;
                label?: string | undefined;
            }[] | undefined;
            chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
            xAxis?: string | undefined;
            yAxis?: string[] | undefined;
            aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
            powerBIConfig?: {
                reportId: string;
                workspaceId: string;
                embedUrl: string;
                datasetId: string;
            } | undefined;
        };
    }, {
        type: "chart" | "table" | "kpi" | "powerbi";
        id: string;
        title: string;
        dataSource: string;
        config: {
            filters?: {
                field: string;
                operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
                value?: any;
                label?: string | undefined;
            }[] | undefined;
            chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
            xAxis?: string | undefined;
            yAxis?: string[] | undefined;
            aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
            powerBIConfig?: {
                reportId: string;
                workspaceId: string;
                embedUrl: string;
                datasetId: string;
            } | undefined;
        };
    }>, "many">;
    filters: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains"]>;
        value: z.ZodAny;
        label: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
        value?: any;
        label?: string | undefined;
    }, {
        field: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
        value?: any;
        label?: string | undefined;
    }>, "many">;
    refreshInterval: z.ZodNumber;
    isPublic: z.ZodBoolean;
    permissions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        resource: z.ZodString;
        action: z.ZodEnum<["read", "write", "delete", "admin"]>;
        scope: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }, {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    permissions: {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }[];
    filters: {
        field: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
        value?: any;
        label?: string | undefined;
    }[];
    layout: {
        columns: number;
        rows: number;
        widgets: {
            id: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }[];
    };
    visualizations: {
        type: "chart" | "table" | "kpi" | "powerbi";
        id: string;
        title: string;
        dataSource: string;
        config: {
            filters?: {
                field: string;
                operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
                value?: any;
                label?: string | undefined;
            }[] | undefined;
            chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
            xAxis?: string | undefined;
            yAxis?: string[] | undefined;
            aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
            powerBIConfig?: {
                reportId: string;
                workspaceId: string;
                embedUrl: string;
                datasetId: string;
            } | undefined;
        };
    }[];
    refreshInterval: number;
    isPublic: boolean;
    description?: string | undefined;
}, {
    id: string;
    name: string;
    permissions: {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }[];
    filters: {
        field: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
        value?: any;
        label?: string | undefined;
    }[];
    layout: {
        columns: number;
        rows: number;
        widgets: {
            id: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }[];
    };
    visualizations: {
        type: "chart" | "table" | "kpi" | "powerbi";
        id: string;
        title: string;
        dataSource: string;
        config: {
            filters?: {
                field: string;
                operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
                value?: any;
                label?: string | undefined;
            }[] | undefined;
            chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
            xAxis?: string | undefined;
            yAxis?: string[] | undefined;
            aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
            powerBIConfig?: {
                reportId: string;
                workspaceId: string;
                embedUrl: string;
                datasetId: string;
            } | undefined;
        };
    }[];
    refreshInterval: number;
    isPublic: boolean;
    description?: string | undefined;
}>;
export declare const WebSocketEventSchema: z.ZodObject<{
    type: z.ZodString;
    data: z.ZodAny;
    timestamp: z.ZodDate;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    timestamp: Date;
    data?: any;
    userId?: string | undefined;
}, {
    type: string;
    timestamp: Date;
    data?: any;
    userId?: string | undefined;
}>;
export declare const SalesUpdateEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    userId: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"sales_update">;
    data: z.ZodObject<{
        id: z.ZodString;
        timestamp: z.ZodDate;
        revenue: z.ZodNumber;
        orderCount: z.ZodNumber;
        averageOrderValue: z.ZodNumber;
        conversionRate: z.ZodNumber;
        period: z.ZodObject<{
            start: z.ZodDate;
            end: z.ZodDate;
            granularity: z.ZodEnum<["hour", "day", "week", "month", "quarter", "year"]>;
        }, "strip", z.ZodTypeAny, {
            start: Date;
            end: Date;
            granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
        }, {
            start: Date;
            end: Date;
            granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
        }>;
        productCategory: z.ZodOptional<z.ZodString>;
        region: z.ZodOptional<z.ZodString>;
        channel: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        timestamp: Date;
        revenue: number;
        orderCount: number;
        averageOrderValue: number;
        conversionRate: number;
        period: {
            start: Date;
            end: Date;
            granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
        };
        productCategory?: string | undefined;
        region?: string | undefined;
        channel?: string | undefined;
    }, {
        id: string;
        timestamp: Date;
        revenue: number;
        orderCount: number;
        averageOrderValue: number;
        conversionRate: number;
        period: {
            start: Date;
            end: Date;
            granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
        };
        productCategory?: string | undefined;
        region?: string | undefined;
        channel?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "sales_update";
    timestamp: Date;
    data: {
        id: string;
        timestamp: Date;
        revenue: number;
        orderCount: number;
        averageOrderValue: number;
        conversionRate: number;
        period: {
            start: Date;
            end: Date;
            granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
        };
        productCategory?: string | undefined;
        region?: string | undefined;
        channel?: string | undefined;
    };
    userId?: string | undefined;
}, {
    type: "sales_update";
    timestamp: Date;
    data: {
        id: string;
        timestamp: Date;
        revenue: number;
        orderCount: number;
        averageOrderValue: number;
        conversionRate: number;
        period: {
            start: Date;
            end: Date;
            granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
        };
        productCategory?: string | undefined;
        region?: string | undefined;
        channel?: string | undefined;
    };
    userId?: string | undefined;
}>;
export declare const CustomerBehaviorUpdateEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    userId: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"customer_behavior_update">;
    data: z.ZodObject<{
        customerId: z.ZodString;
        sessionId: z.ZodString;
        pageViews: z.ZodNumber;
        timeOnSite: z.ZodNumber;
        purchaseIntent: z.ZodNumber;
        segmentId: z.ZodString;
        lifetimeValue: z.ZodNumber;
        lastActivity: z.ZodDate;
        acquisitionChannel: z.ZodString;
        churnRisk: z.ZodNumber;
        averageOrderValue: z.ZodNumber;
        purchaseFrequency: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        averageOrderValue: number;
        customerId: string;
        sessionId: string;
        pageViews: number;
        timeOnSite: number;
        purchaseIntent: number;
        segmentId: string;
        lifetimeValue: number;
        lastActivity: Date;
        acquisitionChannel: string;
        churnRisk: number;
        purchaseFrequency: number;
    }, {
        averageOrderValue: number;
        customerId: string;
        sessionId: string;
        pageViews: number;
        timeOnSite: number;
        purchaseIntent: number;
        segmentId: string;
        lifetimeValue: number;
        lastActivity: Date;
        acquisitionChannel: string;
        churnRisk: number;
        purchaseFrequency: number;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "customer_behavior_update";
    timestamp: Date;
    data: {
        averageOrderValue: number;
        customerId: string;
        sessionId: string;
        pageViews: number;
        timeOnSite: number;
        purchaseIntent: number;
        segmentId: string;
        lifetimeValue: number;
        lastActivity: Date;
        acquisitionChannel: string;
        churnRisk: number;
        purchaseFrequency: number;
    };
    userId?: string | undefined;
}, {
    type: "customer_behavior_update";
    timestamp: Date;
    data: {
        averageOrderValue: number;
        customerId: string;
        sessionId: string;
        pageViews: number;
        timeOnSite: number;
        purchaseIntent: number;
        segmentId: string;
        lifetimeValue: number;
        lastActivity: Date;
        acquisitionChannel: string;
        churnRisk: number;
        purchaseFrequency: number;
    };
    userId?: string | undefined;
}>;
export declare const SupplyChainAlertEventSchema: z.ZodObject<{
    timestamp: z.ZodDate;
    userId: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodLiteral<"supply_chain_alert">;
    data: z.ZodObject<{
        productId: z.ZodString;
        alertType: z.ZodEnum<["low_stock", "stockout", "supplier_delay"]>;
        severity: z.ZodEnum<["low", "medium", "high"]>;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        productId: string;
        alertType: "low_stock" | "stockout" | "supplier_delay";
        severity: "low" | "medium" | "high";
    }, {
        message: string;
        productId: string;
        alertType: "low_stock" | "stockout" | "supplier_delay";
        severity: "low" | "medium" | "high";
    }>;
}, "strip", z.ZodTypeAny, {
    type: "supply_chain_alert";
    timestamp: Date;
    data: {
        message: string;
        productId: string;
        alertType: "low_stock" | "stockout" | "supplier_delay";
        severity: "low" | "medium" | "high";
    };
    userId?: string | undefined;
}, {
    type: "supply_chain_alert";
    timestamp: Date;
    data: {
        message: string;
        productId: string;
        alertType: "low_stock" | "stockout" | "supplier_delay";
        severity: "low" | "medium" | "high";
    };
    userId?: string | undefined;
}>;
export declare const validateSalesMetric: (data: unknown) => {
    id: string;
    timestamp: Date;
    revenue: number;
    orderCount: number;
    averageOrderValue: number;
    conversionRate: number;
    period: {
        start: Date;
        end: Date;
        granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
    };
    productCategory?: string | undefined;
    region?: string | undefined;
    channel?: string | undefined;
};
export declare const validateCustomerBehavior: (data: unknown) => {
    averageOrderValue: number;
    customerId: string;
    sessionId: string;
    pageViews: number;
    timeOnSite: number;
    purchaseIntent: number;
    segmentId: string;
    lifetimeValue: number;
    lastActivity: Date;
    acquisitionChannel: string;
    churnRisk: number;
    purchaseFrequency: number;
};
export declare const validateSupplyChainKPI: (data: unknown) => {
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    leadTime: number;
    supplierPerformance: number;
    fulfillmentRate: number;
    lastUpdated: Date;
    supplierId: string;
    warehouseLocation: string;
    stockoutRisk: "low" | "medium" | "high";
    averageDemand: number;
};
export declare const validateUser: (data: unknown) => {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
        id: string;
        name: string;
        description: string;
        permissions: {
            id: string;
            resource: string;
            action: "read" | "write" | "delete" | "admin";
            scope?: string | undefined;
        }[];
    };
    permissions: {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }[];
    createdAt: Date;
    isActive: boolean;
    lastLogin?: Date | undefined;
};
export declare const validateDashboardConfig: (data: unknown) => {
    id: string;
    name: string;
    permissions: {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }[];
    filters: {
        field: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
        value?: any;
        label?: string | undefined;
    }[];
    layout: {
        columns: number;
        rows: number;
        widgets: {
            id: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }[];
    };
    visualizations: {
        type: "chart" | "table" | "kpi" | "powerbi";
        id: string;
        title: string;
        dataSource: string;
        config: {
            filters?: {
                field: string;
                operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
                value?: any;
                label?: string | undefined;
            }[] | undefined;
            chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
            xAxis?: string | undefined;
            yAxis?: string[] | undefined;
            aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
            powerBIConfig?: {
                reportId: string;
                workspaceId: string;
                embedUrl: string;
                datasetId: string;
            } | undefined;
        };
    }[];
    refreshInterval: number;
    isPublic: boolean;
    description?: string | undefined;
};
export declare const safeParseSalesMetric: (data: unknown) => z.SafeParseReturnType<{
    id: string;
    timestamp: Date;
    revenue: number;
    orderCount: number;
    averageOrderValue: number;
    conversionRate: number;
    period: {
        start: Date;
        end: Date;
        granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
    };
    productCategory?: string | undefined;
    region?: string | undefined;
    channel?: string | undefined;
}, {
    id: string;
    timestamp: Date;
    revenue: number;
    orderCount: number;
    averageOrderValue: number;
    conversionRate: number;
    period: {
        start: Date;
        end: Date;
        granularity: "hour" | "day" | "week" | "month" | "quarter" | "year";
    };
    productCategory?: string | undefined;
    region?: string | undefined;
    channel?: string | undefined;
}>;
export declare const safeParseCustomerBehavior: (data: unknown) => z.SafeParseReturnType<{
    averageOrderValue: number;
    customerId: string;
    sessionId: string;
    pageViews: number;
    timeOnSite: number;
    purchaseIntent: number;
    segmentId: string;
    lifetimeValue: number;
    lastActivity: Date;
    acquisitionChannel: string;
    churnRisk: number;
    purchaseFrequency: number;
}, {
    averageOrderValue: number;
    customerId: string;
    sessionId: string;
    pageViews: number;
    timeOnSite: number;
    purchaseIntent: number;
    segmentId: string;
    lifetimeValue: number;
    lastActivity: Date;
    acquisitionChannel: string;
    churnRisk: number;
    purchaseFrequency: number;
}>;
export declare const safeParseSupplyChainKPI: (data: unknown) => z.SafeParseReturnType<{
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    leadTime: number;
    supplierPerformance: number;
    fulfillmentRate: number;
    lastUpdated: Date;
    supplierId: string;
    warehouseLocation: string;
    stockoutRisk: "low" | "medium" | "high";
    averageDemand: number;
}, {
    productId: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    leadTime: number;
    supplierPerformance: number;
    fulfillmentRate: number;
    lastUpdated: Date;
    supplierId: string;
    warehouseLocation: string;
    stockoutRisk: "low" | "medium" | "high";
    averageDemand: number;
}>;
export declare const safeParseUser: (data: unknown) => z.SafeParseReturnType<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
        id: string;
        name: string;
        description: string;
        permissions: {
            id: string;
            resource: string;
            action: "read" | "write" | "delete" | "admin";
            scope?: string | undefined;
        }[];
    };
    permissions: {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }[];
    createdAt: Date;
    isActive: boolean;
    lastLogin?: Date | undefined;
}, {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: {
        id: string;
        name: string;
        description: string;
        permissions: {
            id: string;
            resource: string;
            action: "read" | "write" | "delete" | "admin";
            scope?: string | undefined;
        }[];
    };
    permissions: {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }[];
    createdAt: Date;
    isActive: boolean;
    lastLogin?: Date | undefined;
}>;
export declare const safeParseDashboardConfig: (data: unknown) => z.SafeParseReturnType<{
    id: string;
    name: string;
    permissions: {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }[];
    filters: {
        field: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
        value?: any;
        label?: string | undefined;
    }[];
    layout: {
        columns: number;
        rows: number;
        widgets: {
            id: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }[];
    };
    visualizations: {
        type: "chart" | "table" | "kpi" | "powerbi";
        id: string;
        title: string;
        dataSource: string;
        config: {
            filters?: {
                field: string;
                operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
                value?: any;
                label?: string | undefined;
            }[] | undefined;
            chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
            xAxis?: string | undefined;
            yAxis?: string[] | undefined;
            aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
            powerBIConfig?: {
                reportId: string;
                workspaceId: string;
                embedUrl: string;
                datasetId: string;
            } | undefined;
        };
    }[];
    refreshInterval: number;
    isPublic: boolean;
    description?: string | undefined;
}, {
    id: string;
    name: string;
    permissions: {
        id: string;
        resource: string;
        action: "read" | "write" | "delete" | "admin";
        scope?: string | undefined;
    }[];
    filters: {
        field: string;
        operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
        value?: any;
        label?: string | undefined;
    }[];
    layout: {
        columns: number;
        rows: number;
        widgets: {
            id: string;
            x: number;
            y: number;
            width: number;
            height: number;
        }[];
    };
    visualizations: {
        type: "chart" | "table" | "kpi" | "powerbi";
        id: string;
        title: string;
        dataSource: string;
        config: {
            filters?: {
                field: string;
                operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "contains";
                value?: any;
                label?: string | undefined;
            }[] | undefined;
            chartType?: "line" | "bar" | "pie" | "scatter" | "area" | undefined;
            xAxis?: string | undefined;
            yAxis?: string[] | undefined;
            aggregation?: "sum" | "avg" | "count" | "min" | "max" | undefined;
            powerBIConfig?: {
                reportId: string;
                workspaceId: string;
                embedUrl: string;
                datasetId: string;
            } | undefined;
        };
    }[];
    refreshInterval: number;
    isPublic: boolean;
    description?: string | undefined;
}>;

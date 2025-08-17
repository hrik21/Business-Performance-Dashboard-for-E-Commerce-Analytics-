/**
 * Core business entity interfaces for the E-commerce BI Dashboard
 * These interfaces define the structure of business data models
 */

export interface TimePeriod {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface SalesMetric {
  id: string;
  timestamp: Date;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  conversionRate: number;
  period: TimePeriod;
  productCategory?: string;
  region?: string;
  channel?: string;
}

export interface CustomerBehavior {
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
  averageOrderValue: number;
  purchaseFrequency: number;
}

export interface SupplyChainKPI {
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
  stockoutRisk: 'low' | 'medium' | 'high';
  averageDemand: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
  scope?: string;
}
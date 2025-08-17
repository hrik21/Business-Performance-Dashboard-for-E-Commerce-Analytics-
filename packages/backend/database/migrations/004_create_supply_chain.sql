-- Migration: Create supply chain tables
-- Description: Set up tables for supply chain KPIs and inventory management

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    performance_rating DECIMAL(3,2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    capacity INTEGER CHECK (capacity > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    unit_cost DECIMAL(10,2) CHECK (unit_cost >= 0),
    unit_price DECIMAL(10,2) CHECK (unit_price >= 0),
    weight DECIMAL(8,3) CHECK (weight >= 0),
    dimensions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create supply_chain_kpis table
CREATE TABLE IF NOT EXISTS supply_chain_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    current_stock INTEGER NOT NULL CHECK (current_stock >= 0),
    reorder_point INTEGER NOT NULL CHECK (reorder_point >= 0),
    lead_time INTEGER NOT NULL CHECK (lead_time >= 0), -- in days
    supplier_performance DECIMAL(3,2) NOT NULL CHECK (supplier_performance >= 0 AND supplier_performance <= 1),
    fulfillment_rate DECIMAL(3,2) NOT NULL CHECK (fulfillment_rate >= 0 AND fulfillment_rate <= 1),
    stockout_risk VARCHAR(10) NOT NULL CHECK (stockout_risk IN ('low', 'medium', 'high')),
    average_demand DECIMAL(10,2) NOT NULL CHECK (average_demand >= 0),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory_movements table for tracking stock changes
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('inbound', 'outbound', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    reference_id VARCHAR(255), -- order_id, transfer_id, etc.
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create supply_chain_alerts table
CREATE TABLE IF NOT EXISTS supply_chain_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID REFERENCES warehouses(id),
    supplier_id UUID REFERENCES suppliers(id),
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('low_stock', 'stockout', 'supplier_delay', 'quality_issue', 'demand_spike')),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    threshold_value DECIMAL(15,2),
    actual_value DECIMAL(15,2),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reorder_recommendations table
CREATE TABLE IF NOT EXISTS reorder_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    recommended_quantity INTEGER NOT NULL CHECK (recommended_quantity > 0),
    urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    estimated_stockout_date TIMESTAMP WITH TIME ZONE,
    cost_impact DECIMAL(12,2),
    demand_forecast DECIMAL(10,2),
    safety_stock_level INTEGER,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create supplier_performance_metrics table
CREATE TABLE IF NOT EXISTS supplier_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    metric_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    metric_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    on_time_delivery_rate DECIMAL(3,2) CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 1),
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
    average_lead_time DECIMAL(8,2) CHECK (average_lead_time >= 0),
    cost_competitiveness DECIMAL(3,2) CHECK (cost_competitiveness >= 0 AND cost_competitiveness <= 1),
    communication_score DECIMAL(3,2) CHECK (communication_score >= 0 AND communication_score <= 1),
    overall_rating DECIMAL(3,2) CHECK (overall_rating >= 0 AND overall_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_supply_chain_kpis_product_id ON supply_chain_kpis(product_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_kpis_warehouse_id ON supply_chain_kpis(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_kpis_supplier_id ON supply_chain_kpis(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_kpis_stockout_risk ON supply_chain_kpis(stockout_risk);
CREATE INDEX IF NOT EXISTS idx_supply_chain_kpis_last_updated ON supply_chain_kpis(last_updated);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse_id ON inventory_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_timestamp ON inventory_movements(timestamp);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);

CREATE INDEX IF NOT EXISTS idx_supply_chain_alerts_product_id ON supply_chain_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_supply_chain_alerts_type ON supply_chain_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_supply_chain_alerts_severity ON supply_chain_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_supply_chain_alerts_resolved ON supply_chain_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_supply_chain_alerts_created ON supply_chain_alerts(created_at);

CREATE INDEX IF NOT EXISTS idx_reorder_recommendations_product_id ON reorder_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_reorder_recommendations_urgency ON reorder_recommendations(urgency);
CREATE INDEX IF NOT EXISTS idx_reorder_recommendations_approved ON reorder_recommendations(is_approved);
CREATE INDEX IF NOT EXISTS idx_reorder_recommendations_stockout_date ON reorder_recommendations(estimated_stockout_date);

CREATE INDEX IF NOT EXISTS idx_supplier_performance_supplier_id ON supplier_performance_metrics(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_performance_period ON supplier_performance_metrics(metric_period_start, metric_period_end);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_supply_chain_kpis_composite ON supply_chain_kpis(product_id, warehouse_id, stockout_risk);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_composite ON inventory_movements(product_id, warehouse_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_supply_chain_alerts_composite ON supply_chain_alerts(product_id, alert_type, is_resolved);
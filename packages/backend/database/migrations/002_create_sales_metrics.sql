-- Migration: Create sales metrics tables
-- Description: Set up tables for storing sales performance data

-- Create sales_metrics table
CREATE TABLE IF NOT EXISTS sales_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    revenue DECIMAL(15,2) NOT NULL CHECK (revenue >= 0),
    order_count INTEGER NOT NULL CHECK (order_count >= 0),
    average_order_value DECIMAL(10,2) NOT NULL CHECK (average_order_value >= 0),
    conversion_rate DECIMAL(5,4) NOT NULL CHECK (conversion_rate >= 0 AND conversion_rate <= 1),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    granularity VARCHAR(20) NOT NULL CHECK (granularity IN ('hour', 'day', 'week', 'month', 'quarter', 'year')),
    product_category VARCHAR(100),
    region VARCHAR(100),
    channel VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sales_trends table for historical trend analysis
CREATE TABLE IF NOT EXISTS sales_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(50) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    current_value DECIMAL(15,2) NOT NULL,
    previous_value DECIMAL(15,2),
    percentage_change DECIMAL(8,4),
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('up', 'down', 'stable')),
    product_category VARCHAR(100),
    region VARCHAR(100),
    channel VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create sales_alerts table for threshold monitoring
CREATE TABLE IF NOT EXISTS sales_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    threshold_value DECIMAL(15,2) NOT NULL,
    actual_value DECIMAL(15,2) NOT NULL,
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    product_category VARCHAR(100),
    region VARCHAR(100),
    channel VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_metrics_timestamp ON sales_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_metrics_period ON sales_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_sales_metrics_granularity ON sales_metrics(granularity);
CREATE INDEX IF NOT EXISTS idx_sales_metrics_category ON sales_metrics(product_category);
CREATE INDEX IF NOT EXISTS idx_sales_metrics_region ON sales_metrics(region);
CREATE INDEX IF NOT EXISTS idx_sales_metrics_channel ON sales_metrics(channel);

CREATE INDEX IF NOT EXISTS idx_sales_trends_period ON sales_trends(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_sales_trends_metric_type ON sales_trends(metric_type);
CREATE INDEX IF NOT EXISTS idx_sales_trends_category ON sales_trends(product_category);

CREATE INDEX IF NOT EXISTS idx_sales_alerts_type ON sales_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_sales_alerts_severity ON sales_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_sales_alerts_resolved ON sales_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_sales_alerts_created ON sales_alerts(created_at);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sales_metrics_composite ON sales_metrics(timestamp, product_category, region);
CREATE INDEX IF NOT EXISTS idx_sales_trends_composite ON sales_trends(period_start, metric_type, product_category);
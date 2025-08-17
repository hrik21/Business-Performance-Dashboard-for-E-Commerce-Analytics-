-- Migration: Create customer behavior tables
-- Description: Set up tables for storing customer analytics and behavior data

-- Create customer_segments table
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    criteria JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_behavior table
CREATE TABLE IF NOT EXISTS customer_behavior (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    page_views INTEGER NOT NULL CHECK (page_views >= 0),
    time_on_site INTEGER NOT NULL CHECK (time_on_site >= 0), -- in seconds
    purchase_intent DECIMAL(3,2) NOT NULL CHECK (purchase_intent >= 0 AND purchase_intent <= 1),
    segment_id UUID REFERENCES customer_segments(id),
    lifetime_value DECIMAL(12,2) NOT NULL CHECK (lifetime_value >= 0),
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL,
    acquisition_channel VARCHAR(100) NOT NULL,
    churn_risk DECIMAL(3,2) NOT NULL CHECK (churn_risk >= 0 AND churn_risk <= 1),
    average_order_value DECIMAL(10,2) NOT NULL CHECK (average_order_value >= 0),
    purchase_frequency DECIMAL(8,4) NOT NULL CHECK (purchase_frequency >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_journey table for tracking customer touchpoints
CREATE TABLE IF NOT EXISTS customer_journey (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    touchpoint_type VARCHAR(50) NOT NULL,
    touchpoint_value VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    page_url TEXT,
    referrer_url TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_churn_predictions table
CREATE TABLE IF NOT EXISTS customer_churn_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    churn_probability DECIMAL(3,2) NOT NULL CHECK (churn_probability >= 0 AND churn_probability <= 1),
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    contributing_factors JSONB,
    prediction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    model_version VARCHAR(50),
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    recommended_actions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_ltv_calculations table
CREATE TABLE IF NOT EXISTS customer_ltv_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    current_ltv DECIMAL(12,2) NOT NULL CHECK (current_ltv >= 0),
    predicted_ltv DECIMAL(12,2) CHECK (predicted_ltv >= 0),
    calculation_method VARCHAR(50) NOT NULL,
    calculation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    factors JSONB,
    confidence_interval JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_behavior_customer_id ON customer_behavior(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_behavior_session_id ON customer_behavior(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_behavior_segment_id ON customer_behavior(segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_behavior_last_activity ON customer_behavior(last_activity);
CREATE INDEX IF NOT EXISTS idx_customer_behavior_churn_risk ON customer_behavior(churn_risk);
CREATE INDEX IF NOT EXISTS idx_customer_behavior_acquisition_channel ON customer_behavior(acquisition_channel);

CREATE INDEX IF NOT EXISTS idx_customer_journey_customer_id ON customer_journey(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_session_id ON customer_journey(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_timestamp ON customer_journey(timestamp);
CREATE INDEX IF NOT EXISTS idx_customer_journey_touchpoint_type ON customer_journey(touchpoint_type);

CREATE INDEX IF NOT EXISTS idx_customer_churn_customer_id ON customer_churn_predictions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_churn_risk_level ON customer_churn_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_customer_churn_prediction_date ON customer_churn_predictions(prediction_date);

CREATE INDEX IF NOT EXISTS idx_customer_ltv_customer_id ON customer_ltv_calculations(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_ltv_calculation_date ON customer_ltv_calculations(calculation_date);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_customer_behavior_composite ON customer_behavior(customer_id, last_activity, segment_id);
CREATE INDEX IF NOT EXISTS idx_customer_journey_composite ON customer_journey(customer_id, timestamp, touchpoint_type);

-- Insert default customer segments
INSERT INTO customer_segments (name, description, criteria) VALUES 
    ('High Value', 'Customers with high lifetime value and frequent purchases', '{"min_ltv": 1000, "min_frequency": 5}'),
    ('At Risk', 'Customers with high churn probability', '{"min_churn_risk": 0.7}'),
    ('New Customers', 'Recently acquired customers', '{"max_days_since_acquisition": 30}'),
    ('Loyal Customers', 'Long-term customers with consistent purchase behavior', '{"min_days_active": 365, "min_purchases": 10}')
ON CONFLICT (name) DO NOTHING;
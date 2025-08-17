-- Migration: Create dashboard and visualization tables
-- Description: Set up tables for dashboard management and configuration

-- Create dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id),
    layout_config JSONB NOT NULL,
    refresh_interval INTEGER NOT NULL CHECK (refresh_interval >= 5 AND refresh_interval <= 3600), -- 5 seconds to 1 hour
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create visualizations table
CREATE TABLE IF NOT EXISTS visualizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('chart', 'table', 'kpi', 'powerbi')),
    data_source VARCHAR(100) NOT NULL,
    config JSONB NOT NULL,
    position_x INTEGER NOT NULL CHECK (position_x >= 0),
    position_y INTEGER NOT NULL CHECK (position_y >= 0),
    width INTEGER NOT NULL CHECK (width > 0),
    height INTEGER NOT NULL CHECK (height > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create dashboard_filters table
CREATE TABLE IF NOT EXISTS dashboard_filters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    field VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL CHECK (operator IN ('eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains')),
    value JSONB NOT NULL,
    label VARCHAR(255),
    is_global BOOLEAN DEFAULT false, -- applies to all visualizations
    target_visualizations UUID[], -- specific visualization IDs if not global
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create dashboard_permissions table
CREATE TABLE IF NOT EXISTS dashboard_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('read', 'write', 'admin')),
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT check_user_or_role CHECK (
        (user_id IS NOT NULL AND role_id IS NULL) OR 
        (user_id IS NULL AND role_id IS NOT NULL)
    )
);

-- Create dashboard_shares table for public sharing
CREATE TABLE IF NOT EXISTS dashboard_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    share_token VARCHAR(255) NOT NULL UNIQUE,
    share_type VARCHAR(20) NOT NULL CHECK (share_type IN ('public', 'link', 'embed')),
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    max_access_count INTEGER,
    allowed_domains TEXT[], -- for embed restrictions
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP WITH TIME ZONE
);

-- Create dashboard_usage_analytics table
CREATE TABLE IF NOT EXISTS dashboard_usage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('view', 'filter', 'export', 'share', 'refresh')),
    action_details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create powerbi_reports table for Power BI integration
CREATE TABLE IF NOT EXISTS powerbi_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id VARCHAR(255) NOT NULL UNIQUE,
    workspace_id VARCHAR(255) NOT NULL,
    dataset_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    embed_url TEXT NOT NULL,
    web_url TEXT,
    last_refresh TIMESTAMP WITH TIME ZONE,
    refresh_schedule JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create powerbi_datasets table
CREATE TABLE IF NOT EXISTS powerbi_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id VARCHAR(255) NOT NULL UNIQUE,
    workspace_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    connection_string TEXT,
    refresh_schedule JSONB,
    last_refresh TIMESTAMP WITH TIME ZONE,
    refresh_status VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create data_sources table for tracking external data connections
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('database', 'api', 'file', 'stream')),
    connection_config JSONB NOT NULL,
    credentials_encrypted TEXT,
    health_status VARCHAR(20) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
    last_health_check TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dashboards_owner_id ON dashboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_is_public ON dashboards(is_public);
CREATE INDEX IF NOT EXISTS idx_dashboards_is_active ON dashboards(is_active);
CREATE INDEX IF NOT EXISTS idx_dashboards_created_at ON dashboards(created_at);

CREATE INDEX IF NOT EXISTS idx_visualizations_dashboard_id ON visualizations(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_type ON visualizations(type);
CREATE INDEX IF NOT EXISTS idx_visualizations_data_source ON visualizations(data_source);
CREATE INDEX IF NOT EXISTS idx_visualizations_is_active ON visualizations(is_active);

CREATE INDEX IF NOT EXISTS idx_dashboard_filters_dashboard_id ON dashboard_filters(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_filters_field ON dashboard_filters(field);
CREATE INDEX IF NOT EXISTS idx_dashboard_filters_is_global ON dashboard_filters(is_global);

CREATE INDEX IF NOT EXISTS idx_dashboard_permissions_dashboard_id ON dashboard_permissions(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_permissions_user_id ON dashboard_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_permissions_role_id ON dashboard_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_permissions_is_active ON dashboard_permissions(is_active);

CREATE INDEX IF NOT EXISTS idx_dashboard_shares_dashboard_id ON dashboard_shares(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_token ON dashboard_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_expires_at ON dashboard_shares(expires_at);

CREATE INDEX IF NOT EXISTS idx_dashboard_usage_dashboard_id ON dashboard_usage_analytics(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_user_id ON dashboard_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_timestamp ON dashboard_usage_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_dashboard_usage_action_type ON dashboard_usage_analytics(action_type);

CREATE INDEX IF NOT EXISTS idx_powerbi_reports_report_id ON powerbi_reports(report_id);
CREATE INDEX IF NOT EXISTS idx_powerbi_reports_workspace_id ON powerbi_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_powerbi_reports_is_active ON powerbi_reports(is_active);

CREATE INDEX IF NOT EXISTS idx_powerbi_datasets_dataset_id ON powerbi_datasets(dataset_id);
CREATE INDEX IF NOT EXISTS idx_powerbi_datasets_workspace_id ON powerbi_datasets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_powerbi_datasets_is_active ON powerbi_datasets(is_active);

CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_health_status ON data_sources(health_status);
CREATE INDEX IF NOT EXISTS idx_data_sources_is_active ON data_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_data_sources_created_by ON data_sources(created_by);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_dashboards_composite ON dashboards(owner_id, is_public, is_active);
CREATE INDEX IF NOT EXISTS idx_visualizations_composite ON visualizations(dashboard_id, type, is_active);
CREATE INDEX IF NOT EXISTS idx_dashboard_permissions_composite ON dashboard_permissions(dashboard_id, permission_type, is_active);
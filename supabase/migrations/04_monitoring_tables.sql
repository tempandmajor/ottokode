-- Application logs table
CREATE TABLE IF NOT EXISTS public.application_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
    message TEXT NOT NULL,
    category TEXT NOT NULL,
    data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Application metrics table
CREATE TABLE IF NOT EXISTS public.application_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    tags JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events table
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    details JSONB NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error reports table
CREATE TABLE IF NOT EXISTS public.error_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    component TEXT,
    metadata JSONB,
    user_agent TEXT,
    url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    metric_type TEXT NOT NULL, -- 'page_load', 'api_call', 'user_action', etc.
    metric_name TEXT NOT NULL,
    duration_ms DECIMAL(10,3),
    success BOOLEAN DEFAULT true,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health table
CREATE TABLE IF NOT EXISTS public.system_health (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    threshold_warning DECIMAL(15,6),
    threshold_critical DECIMAL(15,6),
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for monitoring tables
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id ON public.application_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON public.application_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON public.application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_category ON public.application_logs(category);
CREATE INDEX IF NOT EXISTS idx_application_logs_session_id ON public.application_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_application_metrics_user_id ON public.application_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_application_metrics_timestamp ON public.application_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_application_metrics_name ON public.application_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_application_metrics_session_id ON public.application_metrics(session_id);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON public.security_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);

CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON public.error_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_timestamp ON public.error_reports(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_reports_component ON public.error_reports(component);
CREATE INDEX IF NOT EXISTS idx_error_reports_session_id ON public.error_reports(session_id);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON public.performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON public.performance_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_system_health_timestamp ON public.system_health(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_metric_name ON public.system_health(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON public.system_health(status);

-- RLS policies for monitoring tables
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- Users can only see their own logs and metrics
CREATE POLICY "Users can view own logs" ON public.application_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert logs" ON public.application_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own metrics" ON public.application_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert metrics" ON public.application_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own security events" ON public.security_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert security events" ON public.security_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own error reports" ON public.error_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert error reports" ON public.error_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own performance metrics" ON public.performance_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert performance metrics" ON public.performance_metrics
    FOR INSERT WITH CHECK (true);

-- System health is read-only for authenticated users
CREATE POLICY "Authenticated users can view system health" ON public.system_health
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Function to clean up old monitoring data
CREATE OR REPLACE FUNCTION public.cleanup_monitoring_data()
RETURNS void AS $$
BEGIN
    -- Keep logs for 30 days
    DELETE FROM public.application_logs
    WHERE timestamp < NOW() - INTERVAL '30 days';

    -- Keep metrics for 90 days
    DELETE FROM public.application_metrics
    WHERE timestamp < NOW() - INTERVAL '90 days';

    -- Keep security events for 180 days
    DELETE FROM public.security_events
    WHERE timestamp < NOW() - INTERVAL '180 days';

    -- Keep error reports for 60 days
    DELETE FROM public.error_reports
    WHERE timestamp < NOW() - INTERVAL '60 days';

    -- Keep performance metrics for 90 days
    DELETE FROM public.performance_metrics
    WHERE timestamp < NOW() - INTERVAL '90 days';

    -- Keep system health for 7 days
    DELETE FROM public.system_health
    WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get system health summary
CREATE OR REPLACE FUNCTION public.get_system_health_summary()
RETURNS TABLE(
    total_errors_24h INTEGER,
    avg_response_time_24h DECIMAL(10,3),
    active_users_24h INTEGER,
    total_requests_24h INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INTEGER
         FROM public.application_logs
         WHERE level = 'error'
         AND timestamp >= NOW() - INTERVAL '24 hours') as total_errors_24h,

        (SELECT COALESCE(AVG(duration_ms), 0)
         FROM public.performance_metrics
         WHERE metric_type = 'api_call'
         AND timestamp >= NOW() - INTERVAL '24 hours') as avg_response_time_24h,

        (SELECT COUNT(DISTINCT user_id)::INTEGER
         FROM public.application_logs
         WHERE timestamp >= NOW() - INTERVAL '24 hours'
         AND user_id IS NOT NULL) as active_users_24h,

        (SELECT COUNT(*)::INTEGER
         FROM public.application_logs
         WHERE category = 'api'
         AND timestamp >= NOW() - INTERVAL '24 hours') as total_requests_24h;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    color TEXT DEFAULT '#007acc',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    available_credits DECIMAL(10,4) DEFAULT 0.00,
    used_credits DECIMAL(10,4) DEFAULT 0.00,
    total_credits DECIMAL(10,4) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Credit transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'purchase_failed', 'refund')),
    amount DECIMAL(10,4) NOT NULL,
    credits_amount DECIMAL(10,4) NOT NULL,
    description TEXT NOT NULL,
    stripe_payment_intent_id TEXT,
    ai_provider TEXT,
    ai_model TEXT,
    tokens_used INTEGER,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI usage records table
CREATE TABLE IF NOT EXISTS public.ai_usage_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0.000000,
    request_type TEXT DEFAULT 'chat' CHECK (request_type IN ('chat', 'completion', 'streaming', 'function_call')),
    request_duration INTEGER DEFAULT 0, -- milliseconds
    success BOOLEAN DEFAULT true,
    error_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0.000000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'function')),
    content TEXT NOT NULL,
    tokens INTEGER,
    cost DECIMAL(10,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration sessions table
CREATE TABLE IF NOT EXISTS public.collaboration_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost alerts table
CREATE TABLE IF NOT EXISTS public.cost_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('budget_exceeded', 'unusual_spike', 'daily_limit', 'monthly_limit')),
    message TEXT NOT NULL,
    provider TEXT,
    amount DECIMAL(10,4) NOT NULL,
    threshold DECIMAL(10,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- API keys table (encrypted storage for user's own API keys)
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    key_name TEXT NOT NULL,
    encrypted_key TEXT NOT NULL, -- encrypted with user's password
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider, key_name)
);

-- Subscription plans table (for payment plans)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    credits DECIMAL(10,2) NOT NULL,
    stripe_price_id TEXT NOT NULL,
    features JSONB NOT NULL DEFAULT '[]',
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_records_user_id ON public.ai_usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_records_timestamp ON public.ai_usage_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_owner_id ON public.collaboration_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_cost_alerts_user_id ON public.cost_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (id, name, description, price, credits, stripe_price_id, features, is_popular)
VALUES
    ('starter', 'Starter Plan', '$20/month with 15% markup on AI API costs', 20.00, 20.00, 'price_1S70BXDX7MpgnLAiT2raCNMA',
     '["15% markup on AI API costs", "Access to all AI models", "Priority support", "Usage analytics"]', false),
    ('pro', 'Pro Plan', '$100/month with 15% markup on AI API costs', 100.00, 100.00, 'price_1S70BdDX7MpgnLAiFoIZthjR',
     '["15% markup on AI API costs", "Access to all AI models", "Priority support", "Advanced analytics", "Custom integrations"]', true),
    ('enterprise', 'Enterprise Plan', '$200/month with 10% markup on AI API costs', 200.00, 200.00, 'price_1S70BhDX7MpgnLAi0Lo5qdNO',
     '["Only 10% markup on AI API costs", "Access to all AI models", "Dedicated support", "Advanced analytics", "Custom integrations", "SLA guarantee"]', false),
    ('boost', 'Credit Boost', '$10 credit boost with 10% markup', 10.00, 10.00, 'price_1S70BmDX7MpgnLAiomHtCfbf',
     '["10% markup on AI API costs", "Instant credit top-up", "No expiration"]', false)
ON CONFLICT (id) DO UPDATE SET
    price = EXCLUDED.price,
    credits = EXCLUDED.credits,
    stripe_price_id = EXCLUDED.stripe_price_id,
    features = EXCLUDED.features,
    is_popular = EXCLUDED.is_popular;
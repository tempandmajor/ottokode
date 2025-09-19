#!/bin/bash

# Deploy AI Service with Supabase Edge Functions
# This script sets up the secure AI proxy system

set -e

echo "🚀 Deploying Ottokode AI Service..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if user is logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "🔐 Please log in to Supabase:"
    supabase login
fi

# Initialize Supabase project if not already done
if [ ! -f "supabase/config.toml" ]; then
    echo "📦 Initializing Supabase project..."
    supabase init
fi

# Deploy the AI chat Edge Function
echo "🔧 Deploying AI Chat Edge Function..."
supabase functions deploy ai-chat --no-verify-jwt=false

# Set up environment secrets (you'll need to configure these)
echo "🔑 Setting up environment secrets..."
echo "Please set the following secrets in your Supabase dashboard:"
echo "  - OPENAI_API_KEY (if using OpenAI)"
echo "  - ANTHROPIC_API_KEY (if using Anthropic)"
echo "  - GOOGLE_AI_API_KEY (if using Google AI)"

# Create database tables if they don't exist
echo "📊 Setting up database tables..."
cat << 'EOF' > supabase/migrations/$(date +%Y%m%d%H%M%S)_create_ai_tables.sql
-- Create users table if not exists
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create AI usage tracking table
CREATE TABLE IF NOT EXISTS public.ai_usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    request_type TEXT NOT NULL CHECK (request_type IN ('chat', 'completion', 'streaming', 'function_call')),
    request_duration INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'function')),
    content TEXT NOT NULL,
    tokens INTEGER,
    cost DECIMAL(10,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cost alerts table
CREATE TABLE IF NOT EXISTS public.cost_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('budget_exceeded', 'unusual_spike', 'daily_limit', 'monthly_limit')),
    message TEXT NOT NULL,
    provider TEXT,
    amount DECIMAL(10,6) NOT NULL,
    threshold DECIMAL(10,6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON public.ai_usage_records(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON public.ai_usage_records(provider);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.ai_messages(conversation_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- Users can only see their own data
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own profile') THEN
        CREATE POLICY "Users can view own profile" ON public.users
            FOR SELECT USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.users
            FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- AI usage records policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_usage_records' AND policyname = 'Users can view own usage') THEN
        CREATE POLICY "Users can view own usage" ON public.ai_usage_records
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_usage_records' AND policyname = 'Users can insert own usage') THEN
        CREATE POLICY "Users can insert own usage" ON public.ai_usage_records
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Similar policies for other tables...
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
EOF

# Apply migrations
echo "🔄 Applying database migrations..."
supabase db push

echo "✅ AI Service deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your AI provider API keys in Supabase dashboard > Edge Functions > Secrets"
echo "2. Update your environment variables:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "3. Test the AI chat functionality"
echo ""
echo "🔗 Useful links:"
echo "  - Supabase Dashboard: https://app.supabase.com"
echo "  - Edge Functions: https://app.supabase.com/project/_/functions"
echo "  - Database: https://app.supabase.com/project/_/editor"
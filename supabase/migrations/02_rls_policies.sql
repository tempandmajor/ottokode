-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User credits policies
CREATE POLICY "Users can view own credits" ON public.user_credits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON public.user_credits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON public.user_credits
    FOR UPDATE USING (auth.uid() = user_id);

-- Credit transactions policies
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI usage records policies
CREATE POLICY "Users can view own usage records" ON public.ai_usage_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage records" ON public.ai_usage_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI conversations policies
CREATE POLICY "Users can view own conversations" ON public.ai_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.ai_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.ai_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.ai_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- AI messages policies
CREATE POLICY "Users can view messages in own conversations" ON public.ai_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE id = ai_messages.conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in own conversations" ON public.ai_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations
            WHERE id = ai_messages.conversation_id AND user_id = auth.uid()
        )
    );

-- Collaboration sessions policies
CREATE POLICY "Users can view own sessions" ON public.collaboration_sessions
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view public sessions" ON public.collaboration_sessions
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own sessions" ON public.collaboration_sessions
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own sessions" ON public.collaboration_sessions
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own sessions" ON public.collaboration_sessions
    FOR DELETE USING (auth.uid() = owner_id);

-- Cost alerts policies
CREATE POLICY "Users can view own alerts" ON public.cost_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON public.cost_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.cost_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- User API keys policies (most sensitive data)
CREATE POLICY "Users can view own API keys" ON public.user_api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys" ON public.user_api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys" ON public.user_api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys" ON public.user_api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Subscription plans policies (public read-only)
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

-- Additional security: Create functions to ensure data integrity

-- Function to automatically create user profile and credits on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );

    INSERT INTO public.user_credits (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER user_credits_updated_at BEFORE UPDATE ON public.user_credits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER collaboration_sessions_updated_at BEFORE UPDATE ON public.collaboration_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER user_api_keys_updated_at BEFORE UPDATE ON public.user_api_keys
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
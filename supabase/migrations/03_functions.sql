-- Function to add credits to user account
CREATE OR REPLACE FUNCTION public.add_user_credits(
    p_user_id UUID,
    p_amount DECIMAL(10,4)
)
RETURNS void AS $$
BEGIN
    -- Update user credits
    INSERT INTO public.user_credits (user_id, available_credits, total_credits)
    VALUES (p_user_id, p_amount, p_amount)
    ON CONFLICT (user_id)
    DO UPDATE SET
        available_credits = user_credits.available_credits + p_amount,
        total_credits = user_credits.total_credits + p_amount,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits from user account
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
    p_user_id UUID,
    p_amount DECIMAL(10,4)
)
RETURNS boolean AS $$
DECLARE
    current_credits DECIMAL(10,4);
BEGIN
    -- Get current available credits
    SELECT available_credits INTO current_credits
    FROM public.user_credits
    WHERE user_id = p_user_id;

    -- Check if user has enough credits
    IF current_credits IS NULL OR current_credits < p_amount THEN
        RETURN false;
    END IF;

    -- Deduct credits
    UPDATE public.user_credits
    SET
        available_credits = available_credits - p_amount,
        used_credits = used_credits + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user credit balance
CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id UUID)
RETURNS TABLE(
    available_credits DECIMAL(10,4),
    used_credits DECIMAL(10,4),
    total_credits DECIMAL(10,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        uc.available_credits,
        uc.used_credits,
        uc.total_credits
    FROM public.user_credits uc
    WHERE uc.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record AI usage and deduct credits
CREATE OR REPLACE FUNCTION public.record_ai_usage(
    p_user_id UUID,
    p_provider TEXT,
    p_model TEXT,
    p_prompt_tokens INTEGER,
    p_completion_tokens INTEGER,
    p_total_tokens INTEGER,
    p_cost DECIMAL(10,6),
    p_request_type TEXT DEFAULT 'chat',
    p_request_duration INTEGER DEFAULT 0,
    p_success BOOLEAN DEFAULT true,
    p_error_code TEXT DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    credits_to_deduct DECIMAL(10,4);
    deduction_success boolean;
BEGIN
    -- Convert cost to credits (1:1 ratio for simplicity)
    credits_to_deduct := p_cost;

    -- Try to deduct credits first
    SELECT public.deduct_user_credits(p_user_id, credits_to_deduct) INTO deduction_success;

    -- Always record usage regardless of credit deduction success
    INSERT INTO public.ai_usage_records (
        user_id,
        provider,
        model,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        cost,
        request_type,
        request_duration,
        success,
        error_code
    ) VALUES (
        p_user_id,
        p_provider,
        p_model,
        p_prompt_tokens,
        p_completion_tokens,
        p_total_tokens,
        p_cost,
        p_request_type,
        p_request_duration,
        p_success AND deduction_success, -- Mark as failed if credit deduction failed
        CASE WHEN NOT deduction_success THEN 'insufficient_credits' ELSE p_error_code END
    );

    -- If successful and we deducted credits, also record the credit transaction
    IF deduction_success AND credits_to_deduct > 0 THEN
        INSERT INTO public.credit_transactions (
            user_id,
            transaction_type,
            amount,
            credits_amount,
            description,
            ai_provider,
            ai_model,
            tokens_used
        ) VALUES (
            p_user_id,
            'usage',
            p_cost,
            -credits_to_deduct, -- negative because it's a deduction
            FORMAT('AI request: %s/%s - %s tokens', p_provider, p_model, p_total_tokens),
            p_provider,
            p_model,
            p_total_tokens
        );
    END IF;

    RETURN deduction_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user usage statistics
CREATE OR REPLACE FUNCTION public.get_user_usage_stats(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_requests INTEGER,
    total_tokens INTEGER,
    total_cost DECIMAL(10,6),
    average_cost_per_request DECIMAL(10,6),
    most_used_provider TEXT,
    most_used_model TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*)::INTEGER as req_count,
            SUM(aur.total_tokens)::INTEGER as token_sum,
            SUM(aur.cost) as cost_sum,
            aur.provider,
            aur.model
        FROM public.ai_usage_records aur
        WHERE aur.user_id = p_user_id
        AND aur.created_at >= NOW() - (p_days || ' days')::INTERVAL
        AND aur.success = true
        GROUP BY aur.provider, aur.model
    ),
    provider_stats AS (
        SELECT provider, SUM(req_count) as total_reqs
        FROM stats
        GROUP BY provider
        ORDER BY total_reqs DESC
        LIMIT 1
    ),
    model_stats AS (
        SELECT provider || '/' || model as full_model, SUM(req_count) as total_reqs
        FROM stats
        GROUP BY provider, model
        ORDER BY total_reqs DESC
        LIMIT 1
    )
    SELECT
        COALESCE(SUM(s.req_count), 0)::INTEGER,
        COALESCE(SUM(s.token_sum), 0)::INTEGER,
        COALESCE(SUM(s.cost_sum), 0),
        CASE
            WHEN SUM(s.req_count) > 0 THEN SUM(s.cost_sum) / SUM(s.req_count)
            ELSE 0
        END,
        ps.provider,
        ms.full_model
    FROM stats s
    CROSS JOIN provider_stats ps
    CROSS JOIN model_stats ms;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create cost alert
CREATE OR REPLACE FUNCTION public.create_cost_alert(
    p_user_id UUID,
    p_alert_type TEXT,
    p_message TEXT,
    p_provider TEXT DEFAULT NULL,
    p_amount DECIMAL(10,4),
    p_threshold DECIMAL(10,4)
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO public.cost_alerts (
        user_id,
        alert_type,
        message,
        provider,
        amount,
        threshold
    ) VALUES (
        p_user_id,
        p_alert_type,
        p_message,
        p_provider,
        p_amount,
        p_threshold
    )
    RETURNING id INTO alert_id;

    RETURN alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and create automatic cost alerts
CREATE OR REPLACE FUNCTION public.check_cost_alerts(p_user_id UUID)
RETURNS void AS $$
DECLARE
    daily_cost DECIMAL(10,6);
    monthly_cost DECIMAL(10,6);
    current_credits DECIMAL(10,4);
    daily_threshold DECIMAL(10,4) := 10.00; -- $10 daily threshold
    monthly_threshold DECIMAL(10,4) := 100.00; -- $100 monthly threshold
    low_credit_threshold DECIMAL(10,4) := 5.00; -- $5 low credit threshold
BEGIN
    -- Get current credits
    SELECT available_credits INTO current_credits
    FROM public.user_credits
    WHERE user_id = p_user_id;

    -- Get daily cost
    SELECT COALESCE(SUM(cost), 0) INTO daily_cost
    FROM public.ai_usage_records
    WHERE user_id = p_user_id
    AND created_at >= CURRENT_DATE;

    -- Get monthly cost
    SELECT COALESCE(SUM(cost), 0) INTO monthly_cost
    FROM public.ai_usage_records
    WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', CURRENT_DATE);

    -- Check for low credits
    IF current_credits IS NOT NULL AND current_credits < low_credit_threshold THEN
        -- Check if we already sent this alert recently
        IF NOT EXISTS (
            SELECT 1 FROM public.cost_alerts
            WHERE user_id = p_user_id
            AND alert_type = 'low_credits'
            AND created_at >= CURRENT_DATE - INTERVAL '1 day'
        ) THEN
            PERFORM public.create_cost_alert(
                p_user_id,
                'low_credits',
                FORMAT('Your credit balance is low: $%.2f remaining', current_credits),
                NULL,
                current_credits,
                low_credit_threshold
            );
        END IF;
    END IF;

    -- Check for daily limit
    IF daily_cost > daily_threshold THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.cost_alerts
            WHERE user_id = p_user_id
            AND alert_type = 'daily_limit'
            AND created_at >= CURRENT_DATE
        ) THEN
            PERFORM public.create_cost_alert(
                p_user_id,
                'daily_limit',
                FORMAT('Daily spending limit exceeded: $%.2f spent today', daily_cost),
                NULL,
                daily_cost,
                daily_threshold
            );
        END IF;
    END IF;

    -- Check for monthly limit
    IF monthly_cost > monthly_threshold THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.cost_alerts
            WHERE user_id = p_user_id
            AND alert_type = 'monthly_limit'
            AND created_at >= date_trunc('month', CURRENT_DATE)
        ) THEN
            PERFORM public.create_cost_alert(
                p_user_id,
                'monthly_limit',
                FORMAT('Monthly spending limit exceeded: $%.2f spent this month', monthly_cost),
                NULL,
                monthly_cost,
                monthly_threshold
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
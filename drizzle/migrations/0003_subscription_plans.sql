ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS paddle_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS paddle_customer_id text,
  ADD COLUMN IF NOT EXISTS price_id text,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_plan_key;

CREATE OR REPLACE FUNCTION public.current_plan(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((
    SELECT plan FROM public.subscriptions
    WHERE user_id = _user_id AND paddle_subscription_id IS NOT NULL
      AND (status IN ('active','trialing','past_due')
           OR (status = 'canceled' AND current_period_end > now()))
    ORDER BY CASE plan WHEN 'professional' THEN 3 WHEN 'student' THEN 2 WHEN 'starter' THEN 1 ELSE 0 END DESC
    LIMIT 1), 'free');
$$;

CREATE OR REPLACE FUNCTION public.plan_project_limit(_plan text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _plan WHEN 'starter' THEN 2 WHEN 'student' THEN 5 WHEN 'professional' THEN 15 ELSE 1 END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_project_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _limit integer; _count integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  _limit := public.plan_project_limit(public.current_plan(NEW.user_id));
  SELECT count(*) INTO _count FROM public.projects WHERE user_id = NEW.user_id AND status <> 'completed';
  IF _count >= _limit THEN
    RAISE EXCEPTION 'project_limit_reached: your plan allows % active project(s)', _limit;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS t_projects_limit ON public.projects;
CREATE TRIGGER t_projects_limit BEFORE INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION public.enforce_project_limit();

CREATE OR REPLACE FUNCTION public.reset_plan_credits(_user_id uuid, _credits numeric, _ref text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _old numeric;
BEGIN
  IF EXISTS (SELECT 1 FROM public.credit_transactions WHERE user_id = _user_id AND kind = 'plan_reset' AND reason = _ref) THEN RETURN; END IF;
  INSERT INTO public.credit_balances (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT balance INTO _old FROM public.credit_balances WHERE user_id = _user_id FOR UPDATE;
  UPDATE public.credit_balances
    SET balance = _credits, lifetime_granted = lifetime_granted + GREATEST(_credits - _old, 0)
    WHERE user_id = _user_id;
  INSERT INTO public.credit_transactions (user_id, delta, kind, reason)
  VALUES (_user_id, _credits - _old, 'plan_reset', _ref);
END; $$;
REVOKE ALL ON FUNCTION public.reset_plan_credits(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_plan_credits(uuid, numeric, text) TO service_role;
REVOKE ALL ON FUNCTION public.enforce_project_limit() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_plan(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.credit_balances (user_id, balance, lifetime_granted)
  VALUES (NEW.id, 100, 100)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.credit_transactions (user_id, delta, kind, reason)
  VALUES (NEW.id, 100, 'starter', 'Welcome credits');
  RETURN NEW;
END; $$;
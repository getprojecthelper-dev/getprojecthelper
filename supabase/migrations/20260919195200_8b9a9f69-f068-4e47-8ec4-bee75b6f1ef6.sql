CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.has_role(_user_id, _role)
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.redeem_referral_code(_code text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.referral_codes%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT * INTO _row FROM public.referral_codes
   WHERE code = upper(btrim(_code)) FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'That code does not exist.'; END IF;
  IF NOT _row.is_active THEN RAISE EXCEPTION 'That code is no longer active.'; END IF;
  IF _row.expires_at IS NOT NULL AND _row.expires_at < now() THEN RAISE EXCEPTION 'That code has expired.'; END IF;
  IF _row.max_redemptions IS NOT NULL AND _row.redemption_count >= _row.max_redemptions THEN
    RAISE EXCEPTION 'That code has reached its limit.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.code_redemptions WHERE code_id = _row.id AND user_id = _uid) THEN
    RAISE EXCEPTION 'You have already used that code.';
  END IF;

  INSERT INTO public.code_redemptions (code_id, user_id, credits) VALUES (_row.id, _uid, _row.credits);
  UPDATE public.referral_codes SET redemption_count = redemption_count + 1 WHERE id = _row.id;

  PERFORM public.ensure_credit_balance(_uid);
  UPDATE public.credit_balances
     SET balance = balance + _row.credits, lifetime_granted = lifetime_granted + _row.credits
   WHERE user_id = _uid;

  INSERT INTO public.credit_transactions (user_id, delta, kind, reason, ref_id)
  VALUES (_uid, _row.credits, 'redeem', 'Code ' || _row.code, _row.id);

  RETURN _row.credits;
END;
$$;
REVOKE ALL ON FUNCTION private.redeem_referral_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.redeem_referral_code(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.redeem_referral_code(_code text)
RETURNS numeric
LANGUAGE sql
VOLATILE
SECURITY INVOKER
SET search_path = public, private
AS $$
  SELECT private.redeem_referral_code(_code)
$$;
REVOKE ALL ON FUNCTION public.redeem_referral_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_referral_code(text) TO authenticated, service_role;
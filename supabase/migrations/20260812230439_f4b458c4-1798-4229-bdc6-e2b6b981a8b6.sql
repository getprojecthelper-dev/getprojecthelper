-- balances
CREATE TABLE public.credit_balances (
  user_id uuid PRIMARY KEY,
  balance numeric NOT NULL DEFAULT 0,
  lifetime_granted numeric NOT NULL DEFAULT 0,
  lifetime_spent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.credit_balances TO authenticated;
GRANT ALL ON public.credit_balances TO service_role;
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own balance" ON public.credit_balances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read balances" ON public.credit_balances FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER t_credit_balances_updated BEFORE UPDATE ON public.credit_balances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- transactions / ledger
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta numeric NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'spend',
  feature text,
  reason text,
  ref_id uuid,
  status text NOT NULL DEFAULT 'settled',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_tx_user ON public.credit_transactions (user_id, created_at DESC);
GRANT SELECT ON public.credit_transactions TO authenticated;
GRANT ALL ON public.credit_transactions TO service_role;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- referral codes
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  credits numeric NOT NULL DEFAULT 50,
  label text,
  max_redemptions integer,
  redemption_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage codes" ON public.referral_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER t_referral_codes_updated BEFORE UPDATE ON public.referral_codes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- redemptions
CREATE TABLE public.code_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  credits numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code_id, user_id)
);
GRANT SELECT ON public.code_redemptions TO authenticated;
GRANT ALL ON public.code_redemptions TO service_role;
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own redemptions" ON public.code_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read redemptions" ON public.code_redemptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ensure a balance row exists
CREATE OR REPLACE FUNCTION public.ensure_credit_balance(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.credit_balances (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
END; $$;

-- starter grant on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credit_balances (user_id, balance, lifetime_granted)
  VALUES (NEW.id, 50, 50)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_transactions (user_id, delta, kind, reason)
  VALUES (NEW.id, 50, 'starter', 'Welcome credits');

  RETURN NEW;
END; $$;

-- backfill existing users with the starter balance
INSERT INTO public.credit_balances (user_id, balance, lifetime_granted)
SELECT p.id, 50, 50 FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.credit_transactions (user_id, delta, kind, reason)
SELECT p.id, 50, 'starter', 'Welcome credits'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_transactions t WHERE t.user_id = p.id AND t.kind = 'starter'
);

-- redeem a referral code
CREATE OR REPLACE FUNCTION public.redeem_referral_code(_code text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

REVOKE ALL ON FUNCTION public.redeem_referral_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_referral_code(text) TO authenticated;

-- hold credits before an AI run
CREATE OR REPLACE FUNCTION public.hold_credits(_user_id uuid, _amount numeric, _feature text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bal numeric; _id uuid;
BEGIN
  PERFORM public.ensure_credit_balance(_user_id);
  SELECT balance INTO _bal FROM public.credit_balances WHERE user_id = _user_id FOR UPDATE;
  IF _bal < _amount THEN RAISE EXCEPTION 'INSUFFICIENT_CREDITS'; END IF;

  UPDATE public.credit_balances SET balance = balance - _amount WHERE user_id = _user_id;

  INSERT INTO public.credit_transactions (user_id, delta, kind, feature, status, reason)
  VALUES (_user_id, -_amount, 'hold', _feature, 'pending', 'Reserved for ' || _feature)
  RETURNING id INTO _id;

  RETURN _id;
END; $$;
REVOKE ALL ON FUNCTION public.hold_credits(uuid, numeric, text) FROM public;

-- settle a hold with the real cost
CREATE OR REPLACE FUNCTION public.settle_credit_hold(_hold_id uuid, _actual numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tx public.credit_transactions%ROWTYPE; _held numeric; _final numeric; _bal numeric;
BEGIN
  SELECT * INTO _tx FROM public.credit_transactions WHERE id = _hold_id FOR UPDATE;
  IF NOT FOUND OR _tx.status <> 'pending' THEN RETURN 0; END IF;

  _held := -_tx.delta;
  SELECT balance INTO _bal FROM public.credit_balances WHERE user_id = _tx.user_id FOR UPDATE;

  _final := greatest(_actual, 0);
  IF _final > _held + _bal THEN _final := _held + _bal; END IF;

  UPDATE public.credit_balances
     SET balance = balance + _held - _final,
         lifetime_spent = lifetime_spent + _final
   WHERE user_id = _tx.user_id;

  UPDATE public.credit_transactions
     SET delta = -_final, kind = 'spend', status = 'settled',
         reason = 'Used by ' || coalesce(_tx.feature, 'AI')
   WHERE id = _hold_id;

  RETURN _final;
END; $$;
REVOKE ALL ON FUNCTION public.settle_credit_hold(uuid, numeric) FROM public;

-- release a hold when the run fails
CREATE OR REPLACE FUNCTION public.release_credit_hold(_hold_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tx public.credit_transactions%ROWTYPE;
BEGIN
  SELECT * INTO _tx FROM public.credit_transactions WHERE id = _hold_id FOR UPDATE;
  IF NOT FOUND OR _tx.status <> 'pending' THEN RETURN; END IF;

  UPDATE public.credit_balances SET balance = balance + (-_tx.delta) WHERE user_id = _tx.user_id;
  UPDATE public.credit_transactions
     SET delta = 0, status = 'released', kind = 'release', reason = 'Run failed — credits returned'
   WHERE id = _hold_id;
END; $$;
REVOKE ALL ON FUNCTION public.release_credit_hold(uuid) FROM public;

-- admin manual adjustment
CREATE OR REPLACE FUNCTION public.admin_adjust_credits(_user_id uuid, _amount numeric, _reason text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bal numeric;
BEGIN
  PERFORM public.ensure_credit_balance(_user_id);
  UPDATE public.credit_balances
     SET balance = greatest(balance + _amount, 0),
         lifetime_granted = lifetime_granted + greatest(_amount, 0)
   WHERE user_id = _user_id
   RETURNING balance INTO _bal;

  INSERT INTO public.credit_transactions (user_id, delta, kind, reason)
  VALUES (_user_id, _amount, 'admin_adjust', coalesce(_reason, 'Adjusted by admin'));

  RETURN _bal;
END; $$;
REVOKE ALL ON FUNCTION public.admin_adjust_credits(uuid, numeric, text) FROM public;
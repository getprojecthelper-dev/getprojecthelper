REVOKE ALL ON FUNCTION public.hold_credits(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_credit_hold(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_credit_hold(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_adjust_credits(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ensure_credit_balance(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_referral_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_referral_code(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.hold_credits(uuid, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_credit_hold(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_credit_hold(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_credit_balance(uuid) TO service_role;

-- referral codes are managed only through admin server code
REVOKE INSERT, UPDATE, DELETE ON public.referral_codes FROM authenticated;
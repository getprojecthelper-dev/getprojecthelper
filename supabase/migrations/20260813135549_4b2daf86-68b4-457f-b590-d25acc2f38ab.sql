REVOKE EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, numeric, text) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.ensure_credit_balance(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.hold_credits(uuid, numeric, text) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.release_credit_hold(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.settle_credit_hold(uuid, numeric) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon, public;

GRANT EXECUTE ON FUNCTION public.admin_adjust_credits(uuid, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_credit_balance(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.hold_credits(uuid, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_credit_hold(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_credit_hold(uuid, numeric) TO service_role;
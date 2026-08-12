INSERT INTO public.credit_balances (user_id, balance, lifetime_granted)
SELECT u.id, 50, 50 FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.credit_transactions (user_id, delta, kind, reason)
SELECT b.user_id, 50, 'starter', 'Welcome credits'
FROM public.credit_balances b
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_transactions t
  WHERE t.user_id = b.user_id AND t.kind = 'starter'
);
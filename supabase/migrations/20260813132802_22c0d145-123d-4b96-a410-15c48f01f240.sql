DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.credit_transactions WHERE status = 'pending' LOOP
    PERFORM public.release_credit_hold(r.id);
  END LOOP;
END $$;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;
GRANT SELECT ON public.code_redemptions TO authenticated;
GRANT ALL ON public.code_redemptions TO service_role;
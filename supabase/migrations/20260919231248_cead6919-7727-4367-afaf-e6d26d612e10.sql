CREATE TABLE public.project_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  catalog_project_id text NOT NULL,
  payment_transaction_id text NOT NULL,
  payment_customer_id text,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'completed',
  environment text NOT NULL DEFAULT 'sandbox',
  amount_minor integer,
  currency text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_purchases_user_catalog_env_key UNIQUE (user_id, catalog_project_id, environment),
  CONSTRAINT project_purchases_transaction_env_key UNIQUE (payment_transaction_id, environment),
  CONSTRAINT project_purchases_environment_check CHECK (environment IN ('sandbox', 'live')),
  CONSTRAINT project_purchases_status_check CHECK (status IN ('completed', 'refunded'))
);
GRANT SELECT ON public.project_purchases TO authenticated;
GRANT ALL ON public.project_purchases TO service_role;
ALTER TABLE public.project_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own project purchases"
  ON public.project_purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage project purchases"
  ON public.project_purchases FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE TRIGGER project_purchases_updated_at
  BEFORE UPDATE ON public.project_purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
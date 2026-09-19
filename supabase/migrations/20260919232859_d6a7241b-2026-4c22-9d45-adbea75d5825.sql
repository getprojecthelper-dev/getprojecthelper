CREATE TABLE public.project_catalog_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_project_id text NOT NULL,
  price_external_id text NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  regular_price_minor integer NOT NULL,
  discount_percent integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_catalog_pricing_project_env_key UNIQUE (catalog_project_id, environment),
  CONSTRAINT project_catalog_pricing_environment_check CHECK (environment IN ('sandbox', 'live')),
  CONSTRAINT project_catalog_pricing_regular_price_check CHECK (regular_price_minor >= 70),
  CONSTRAINT project_catalog_pricing_discount_check CHECK (discount_percent BETWEEN 0 AND 90)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_catalog_pricing TO authenticated;
GRANT ALL ON public.project_catalog_pricing TO service_role;

ALTER TABLE public.project_catalog_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view active project pricing"
  ON public.project_catalog_pricing
  FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create project pricing"
  ON public.project_catalog_pricing
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update project pricing"
  ON public.project_catalog_pricing
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete project pricing"
  ON public.project_catalog_pricing
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER project_catalog_pricing_updated_at
  BEFORE UPDATE ON public.project_catalog_pricing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.project_catalog_pricing
  (catalog_project_id, price_external_id, environment, regular_price_minor, discount_percent)
VALUES
  ('campus-event-planner', 'campus_event_planner_once', 'sandbox', 40000, 50),
  ('personal-finance-tracker', 'personal_finance_tracker_once', 'sandbox', 40000, 50),
  ('flight-delay-predictor', 'flight_delay_predictor_once', 'sandbox', 40000, 50),
  ('student-performance-analysis', 'student_performance_analysis_once', 'sandbox', 40000, 50),
  ('website-redesign-pm', 'website_redesign_pm_once', 'sandbox', 40000, 50),
  ('office-relocation-pm', 'office_relocation_pm_once', 'sandbox', 40000, 50),
  ('campus-event-planner', 'campus_event_planner_once', 'live', 40000, 50),
  ('personal-finance-tracker', 'personal_finance_tracker_once', 'live', 40000, 50),
  ('flight-delay-predictor', 'flight_delay_predictor_once', 'live', 40000, 50),
  ('student-performance-analysis', 'student_performance_analysis_once', 'live', 40000, 50),
  ('website-redesign-pm', 'website_redesign_pm_once', 'live', 40000, 50),
  ('office-relocation-pm', 'office_relocation_pm_once', 'live', 40000, 50);
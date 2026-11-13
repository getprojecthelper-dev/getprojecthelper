CREATE TABLE public.premade_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL DEFAULT 'sandbox',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  tech_stack text NOT NULL DEFAULT '',
  image_url text,
  domain text NOT NULL DEFAULT 'software',
  price_minor integer NOT NULL,
  provider_price_id text,
  is_live boolean NOT NULL DEFAULT false,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.premade_listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.premade_listings TO authenticated;
GRANT ALL ON public.premade_listings TO service_role;
ALTER TABLE public.premade_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Live listings are public" ON public.premade_listings FOR SELECT TO anon, authenticated USING (is_live = true);
CREATE POLICY "Admins manage listings" ON public.premade_listings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER premade_listings_updated BEFORE UPDATE ON public.premade_listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DELETE FROM public.project_catalog_pricing;
CREATE POLICY "Anyone views premade images" ON storage.objects FOR SELECT USING (bucket_id = 'premade-images');
CREATE POLICY "Admins upload premade images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'premade-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins change premade images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'premade-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete premade images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'premade-images' AND public.has_role(auth.uid(), 'admin'));
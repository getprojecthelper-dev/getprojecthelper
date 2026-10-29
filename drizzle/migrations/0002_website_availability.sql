CREATE TABLE public.site_availability (
 id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
 maintenance_enabled boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_availability TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_availability TO authenticated;
GRANT ALL ON public.site_availability TO service_role;
ALTER TABLE public.site_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public website status" ON public.site_availability FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins create website status" ON public.site_availability FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update website status" ON public.site_availability FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_availability_updated_at BEFORE UPDATE ON public.site_availability FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
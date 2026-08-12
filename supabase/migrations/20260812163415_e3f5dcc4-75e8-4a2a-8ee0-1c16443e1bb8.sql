ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS idea text,
  ADD COLUMN IF NOT EXISTS tech_stack jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dataset jsonb,
  ADD COLUMN IF NOT EXISTS builder_step text NOT NULL DEFAULT 'idea';

CREATE TABLE IF NOT EXISTS public.build_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  title text NOT NULL,
  question text,
  objective text,
  code text,
  language text NOT NULL DEFAULT 'python',
  explanation jsonb NOT NULL DEFAULT '[]'::jsonb,
  insights jsonb NOT NULL DEFAULT '[]'::jsonb,
  business_connection text,
  structure text,
  kind text NOT NULL DEFAULT 'step',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.build_sections TO authenticated;
GRANT ALL ON public.build_sections TO service_role;

ALTER TABLE public.build_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own build sections" ON public.build_sections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER t_build_sections_updated
  BEFORE UPDATE ON public.build_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
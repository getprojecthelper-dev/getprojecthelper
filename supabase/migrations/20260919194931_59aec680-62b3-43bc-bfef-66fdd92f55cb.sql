ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS code_complexity TEXT NOT NULL DEFAULT 'intermediate';

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_code_complexity_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_code_complexity_check
  CHECK (code_complexity IN ('easy', 'intermediate', 'advanced'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
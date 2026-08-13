ALTER TABLE public.risks ADD COLUMN IF NOT EXISTS likelihood text;
ALTER TABLE public.risks ADD COLUMN IF NOT EXISTS impact text;
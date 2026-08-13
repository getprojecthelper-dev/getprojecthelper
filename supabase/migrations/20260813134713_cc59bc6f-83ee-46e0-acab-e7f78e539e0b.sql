CREATE TABLE public.mentor_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_threads TO authenticated;
GRANT ALL ON public.mentor_threads TO service_role;

ALTER TABLE public.mentor_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own mentor threads"
  ON public.mentor_threads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX mentor_threads_project_idx ON public.mentor_threads (project_id, updated_at DESC);

ALTER TABLE public.ai_messages
  ADD COLUMN mentor_thread_id UUID REFERENCES public.mentor_threads(id) ON DELETE CASCADE;

CREATE INDEX ai_messages_mentor_thread_idx ON public.ai_messages (mentor_thread_id, created_at);

-- Move existing mentor conversations into one thread per project.
INSERT INTO public.mentor_threads (user_id, project_id, title, created_at, updated_at)
SELECT m.user_id, m.project_id, 'Earlier conversation', MIN(m.created_at), MAX(m.created_at)
FROM public.ai_messages m
WHERE m.thread = 'mentor' AND m.mentor_thread_id IS NULL
GROUP BY m.user_id, m.project_id;

UPDATE public.ai_messages m
SET mentor_thread_id = t.id
FROM public.mentor_threads t
WHERE m.thread = 'mentor'
  AND m.mentor_thread_id IS NULL
  AND t.project_id = m.project_id
  AND t.user_id = m.user_id
  AND t.title = 'Earlier conversation';
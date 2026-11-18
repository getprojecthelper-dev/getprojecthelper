CREATE INDEX IF NOT EXISTS idx_build_sections_project_position ON public.build_sections (project_id, position);
CREATE INDEX IF NOT EXISTS idx_build_sections_user ON public.build_sections (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON public.projects (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_document_sections_user ON public.document_sections (user_id);
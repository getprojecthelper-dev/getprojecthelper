CREATE TABLE public.project_workspace_entries (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  path text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('file', 'directory')),
  content text NOT NULL DEFAULT '',
  generated_content text NOT NULL DEFAULT '',
  edited boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, path),
  CHECK (path <> '' AND path !~ '(^/|(^|/)\.\.(/|$)|\\)' AND length(path) <= 500)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_workspace_entries TO authenticated;
GRANT ALL ON public.project_workspace_entries TO service_role;
ALTER TABLE public.project_workspace_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read workspace" ON public.project_workspace_entries FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE POLICY "Admins inspect workspace" ON public.project_workspace_entries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners create workspace" ON public.project_workspace_entries FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE POLICY "Owners update workspace" ON public.project_workspace_entries FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE POLICY "Owners delete workspace" ON public.project_workspace_entries FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
CREATE FUNCTION public.merge_project_workspace(_project_id uuid, _entries jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = auth.uid()) THEN RAISE EXCEPTION 'Only the project owner can populate the workspace'; END IF;
  INSERT INTO public.project_workspace_entries (project_id, path, name, type, content, generated_content)
  SELECT _project_id, entry->>'path', entry->>'name', entry->>'type', COALESCE(entry->>'content',''), COALESCE(entry->>'content','') FROM jsonb_array_elements(_entries) entry
  ON CONFLICT (project_id, path) DO UPDATE SET
    generated_content = EXCLUDED.generated_content,
    content = CASE WHEN project_workspace_entries.edited THEN project_workspace_entries.content ELSE EXCLUDED.content END,
    revision = project_workspace_entries.revision + 1,
    updated_at = now()
  WHERE project_workspace_entries.generated_content IS DISTINCT FROM EXCLUDED.generated_content;
END;
$$;
REVOKE ALL ON FUNCTION public.merge_project_workspace(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.merge_project_workspace(uuid, jsonb) TO authenticated;

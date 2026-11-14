REVOKE EXECUTE ON FUNCTION public.current_plan(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_plan(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_project_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _limit integer; _count integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'project owner cannot be changed';
    END IF;
    -- Only reopening a completed project counts against the limit.
    IF NOT (OLD.status = 'completed' AND NEW.status <> 'completed') THEN RETURN NEW; END IF;
  END IF;
  IF public.has_role(NEW.user_id, 'admin') THEN RETURN NEW; END IF;
  _limit := public.plan_project_limit(public.current_plan(NEW.user_id));
  SELECT count(*) INTO _count FROM public.projects
    WHERE user_id = NEW.user_id AND status <> 'completed' AND id <> NEW.id;
  IF _count >= _limit THEN
    RAISE EXCEPTION 'project_limit_reached: your plan allows % active project(s)', _limit;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS enforce_project_limit_on_reopen ON public.projects;
CREATE TRIGGER enforce_project_limit_on_reopen BEFORE UPDATE OF status, user_id ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_limit();
CREATE OR REPLACE FUNCTION public.enforce_project_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _limit integer; _count integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(NEW.user_id, 'admin') THEN RETURN NEW; END IF;
  _limit := public.plan_project_limit(public.current_plan(NEW.user_id));
  SELECT count(*) INTO _count FROM public.projects WHERE user_id = NEW.user_id AND status <> 'completed';
  IF _count >= _limit THEN
    RAISE EXCEPTION 'project_limit_reached: your plan allows % active project(s)', _limit;
  END IF;
  RETURN NEW;
END; $$;
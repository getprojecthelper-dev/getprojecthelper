-- Student subscribers may have up to three active projects. The database trigger
-- calls this function, so this is enforced for every project-creation path.
-- The legacy starter tier remains for existing subscribers only.
CREATE OR REPLACE FUNCTION public.plan_project_limit(_plan text)
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _plan
    WHEN 'starter' THEN 2
    WHEN 'student' THEN 3
    WHEN 'professional' THEN 15
    ELSE 1
  END;
$$;

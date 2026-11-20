CREATE TABLE public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('contact', 'issue', 'grievance')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 3 AND 180),
  message text NOT NULL CHECK (char_length(message) BETWEEN 10 AND 5000),
  page_url text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX support_requests_created_at_idx ON public.support_requests (created_at DESC);
CREATE INDEX support_requests_status_idx ON public.support_requests (status, created_at DESC);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can review support requests"
  ON public.support_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update support requests"
  ON public.support_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.support_requests TO service_role;

CREATE TRIGGER support_requests_updated_at
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

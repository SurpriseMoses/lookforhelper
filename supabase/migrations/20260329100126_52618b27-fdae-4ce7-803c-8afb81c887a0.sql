
-- Jobs table for seeker job postings
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  description text,
  skills text[] NOT NULL DEFAULT '{}',
  location_preference text NOT NULL DEFAULT 'country',
  city text,
  country text,
  province text,
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Job responses table for helper interest
CREATE TABLE public.job_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  helper_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, helper_id)
);

-- RLS for jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open jobs" ON public.jobs
  FOR SELECT TO public
  USING (status = 'open' OR seeker_id = auth.uid());

CREATE POLICY "Verified seekers can create jobs" ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = seeker_id
    AND has_role(auth.uid(), 'seeker')
  );

CREATE POLICY "Seekers can update own jobs" ON public.jobs
  FOR UPDATE TO authenticated
  USING (auth.uid() = seeker_id);

CREATE POLICY "Seekers can delete own jobs" ON public.jobs
  FOR DELETE TO authenticated
  USING (auth.uid() = seeker_id);

-- RLS for job_responses
ALTER TABLE public.job_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job poster and responder can view responses" ON public.job_responses
  FOR SELECT TO authenticated
  USING (
    helper_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.seeker_id = auth.uid())
  );

CREATE POLICY "Helpers can respond to jobs" ON public.job_responses
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = helper_id
    AND has_role(auth.uid(), 'helper')
  );

CREATE POLICY "Helpers can remove own response" ON public.job_responses
  FOR DELETE TO authenticated
  USING (auth.uid() = helper_id);

-- Validation trigger for job status
CREATE OR REPLACE FUNCTION public.validate_job_status()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('open', 'closed', 'filled') THEN
    RAISE EXCEPTION 'Invalid job status: %', NEW.status;
  END IF;
  IF NEW.location_preference NOT IN ('near_me', 'country', 'global') THEN
    RAISE EXCEPTION 'Invalid location preference: %', NEW.location_preference;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_job_status_trigger
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.validate_job_status();

-- Notify seeker when helper shows interest
CREATE OR REPLACE FUNCTION public.notify_job_interest()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _helper_name text;
  _job RECORD;
BEGIN
  SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
  IF _job IS NULL THEN RETURN NEW; END IF;

  SELECT full_name INTO _helper_name FROM public.profiles WHERE user_id = NEW.helper_id;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    _job.seeker_id,
    'interview_request',
    COALESCE(_helper_name, 'A helper') || ' is interested in your job',
    'Check their profile to learn more.',
    '/helper/' || NEW.helper_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_job_interest_trigger
  AFTER INSERT ON public.job_responses
  FOR EACH ROW EXECUTE FUNCTION public.notify_job_interest();

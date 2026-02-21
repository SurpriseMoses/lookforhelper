
-- Create hires table for tracking successful hires (separate from interview-based job_hires)
CREATE TABLE public.hires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  helper_id UUID NOT NULL,
  seeker_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id),
  confirmed_by_helper BOOLEAN NOT NULL DEFAULT false,
  confirmed_by_seeker BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Validation trigger for status
CREATE OR REPLACE FUNCTION public.validate_hire_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Invalid hire status: %', NEW.status;
  END IF;
  -- Auto-confirm when both parties confirm
  IF NEW.confirmed_by_helper = true AND NEW.confirmed_by_seeker = true AND NEW.confirmed_at IS NULL THEN
    NEW.status := 'confirmed';
    NEW.confirmed_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_hire_status_trigger
BEFORE INSERT OR UPDATE ON public.hires
FOR EACH ROW EXECUTE FUNCTION public.validate_hire_status();

-- Notification trigger when hire is created
CREATE OR REPLACE FUNCTION public.notify_hire_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _creator_name TEXT;
  _other_id UUID;
BEGIN
  -- Determine who created and who to notify
  IF NEW.confirmed_by_seeker THEN
    SELECT full_name INTO _creator_name FROM public.profiles WHERE user_id = NEW.seeker_id;
    _other_id := NEW.helper_id;
  ELSE
    SELECT full_name INTO _creator_name FROM public.profiles WHERE user_id = NEW.helper_id;
    _other_id := NEW.seeker_id;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    _other_id,
    'hire_confirmed',
    COALESCE(_creator_name, 'Someone') || ' marked this as a successful hire',
    'Please confirm if you were hired through Look for Helper.',
    '/dashboard'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_hire_request_trigger
AFTER INSERT ON public.hires
FOR EACH ROW EXECUTE FUNCTION public.notify_hire_request();

-- Notification when hire becomes fully confirmed
CREATE OR REPLACE FUNCTION public.notify_hire_fully_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.confirmed_at IS NOT NULL AND OLD.confirmed_at IS NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES
      (NEW.seeker_id, 'hire_confirmed', 'Hire confirmed!', 'Both parties have confirmed the successful hire.', '/dashboard'),
      (NEW.helper_id, 'hire_confirmed', 'Hire confirmed!', 'Both parties have confirmed the successful hire.', '/dashboard');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_hire_fully_confirmed_trigger
AFTER UPDATE ON public.hires
FOR EACH ROW EXECUTE FUNCTION public.notify_hire_fully_confirmed();

-- Enable RLS
ALTER TABLE public.hires ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own hires"
ON public.hires FOR SELECT
USING (auth.uid() = helper_id OR auth.uid() = seeker_id);

CREATE POLICY "Admins can view all hires"
ON public.hires FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create hires"
ON public.hires FOR INSERT
WITH CHECK (
  auth.uid() IN (helper_id, seeker_id)
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = hires.conversation_id
    AND (c.seeker_user_id = auth.uid() OR c.helper_user_id = auth.uid())
  )
);

CREATE POLICY "Participants can update hires"
ON public.hires FOR UPDATE
USING (auth.uid() = helper_id OR auth.uid() = seeker_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hires;

-- Add index for helper hire count queries
CREATE INDEX idx_hires_helper_confirmed ON public.hires (helper_id) WHERE status = 'confirmed';

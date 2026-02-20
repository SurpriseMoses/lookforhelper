
-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_user_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  context_type TEXT NOT NULL DEFAULT 'profile',
  context_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

-- Users can view own reports
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update reports
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Validate report status
CREATE OR REPLACE FUNCTION public.validate_report_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'reviewing', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid report status: %', NEW.status;
  END IF;
  IF NEW.context_type NOT IN ('profile', 'message', 'interview') THEN
    RAISE EXCEPTION 'Invalid context type: %', NEW.context_type;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_report_status_trigger
  BEFORE INSERT OR UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_report_status();

-- Add suspension and verification columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN is_suspended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN suspended_reason TEXT,
  ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;

-- Admins can view all profiles (already have public SELECT, so this is fine)
-- Admins can update any profile for moderation
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

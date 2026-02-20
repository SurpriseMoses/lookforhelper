
-- Reviews table for post-interview ratings
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES public.interviews(id),
  reviewer_user_id UUID NOT NULL,
  reviewee_user_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT unique_review UNIQUE (interview_id, reviewer_user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reviews for completed interviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_user_id
    AND EXISTS (
      SELECT 1 FROM interviews i
      WHERE i.id = interview_id
      AND i.status = 'completed'
      AND (i.seeker_user_id = auth.uid() OR i.helper_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can view reviews they're part of"
  ON public.reviews FOR SELECT
  USING (auth.uid() = reviewer_user_id OR auth.uid() = reviewee_user_id);

CREATE POLICY "Anyone can view reviews for public profiles"
  ON public.reviews FOR SELECT
  USING (true);

-- Job hire confirmations table
CREATE TABLE public.job_hires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interview_id UUID NOT NULL REFERENCES public.interviews(id),
  seeker_user_id UUID NOT NULL,
  helper_user_id UUID NOT NULL,
  seeker_confirmed BOOLEAN NOT NULL DEFAULT false,
  helper_confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_hire UNIQUE (interview_id)
);

ALTER TABLE public.job_hires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own hires"
  ON public.job_hires FOR SELECT
  USING (auth.uid() = seeker_user_id OR auth.uid() = helper_user_id);

CREATE POLICY "Participants can create hire records"
  ON public.job_hires FOR INSERT
  WITH CHECK (
    (auth.uid() = seeker_user_id OR auth.uid() = helper_user_id)
    AND EXISTS (
      SELECT 1 FROM interviews i
      WHERE i.id = interview_id
      AND i.status = 'completed'
      AND (i.seeker_user_id = auth.uid() OR i.helper_user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can update hire records"
  ON public.job_hires FOR UPDATE
  USING (auth.uid() = seeker_user_id OR auth.uid() = helper_user_id);

-- Trigger to set confirmed_at when both sides confirm
CREATE OR REPLACE FUNCTION public.check_hire_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seeker_confirmed = true AND NEW.helper_confirmed = true AND OLD.confirmed_at IS NULL THEN
    NEW.confirmed_at = now();
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_hire_confirmation_trigger
  BEFORE UPDATE ON public.job_hires
  FOR EACH ROW
  EXECUTE FUNCTION public.check_hire_confirmation();

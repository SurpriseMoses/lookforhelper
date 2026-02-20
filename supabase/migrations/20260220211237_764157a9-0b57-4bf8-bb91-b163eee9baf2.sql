
-- Create helper_reviews table (separate from existing interview-based reviews)
CREATE TABLE public.helper_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  helper_id UUID NOT NULL,
  seeker_id UUID NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT helper_reviews_rating_check CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT helper_reviews_unique_pair UNIQUE (helper_id, seeker_id)
);

-- Add average_rating and total_reviews to helper_details
ALTER TABLE public.helper_details
  ADD COLUMN average_rating NUMERIC DEFAULT 0,
  ADD COLUMN total_reviews INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.helper_reviews ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read reviews
CREATE POLICY "Anyone can read helper reviews"
  ON public.helper_reviews FOR SELECT
  USING (true);

-- RLS: Seekers can create reviews
CREATE POLICY "Seekers can create helper reviews"
  ON public.helper_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = seeker_id
    AND has_role(auth.uid(), 'seeker')
    AND helper_id != seeker_id
  );

-- RLS: Reviewer can update own review
CREATE POLICY "Reviewers can update own review"
  ON public.helper_reviews FOR UPDATE
  USING (auth.uid() = seeker_id);

-- RLS: Reviewer can delete own review
CREATE POLICY "Reviewers can delete own review"
  ON public.helper_reviews FOR DELETE
  USING (auth.uid() = seeker_id);

-- Function to recalculate helper rating stats
CREATE OR REPLACE FUNCTION public.recalculate_helper_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _helper_id UUID;
  _avg NUMERIC;
  _count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _helper_id := OLD.helper_id;
  ELSE
    _helper_id := NEW.helper_id;
  END IF;

  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO _avg, _count
  FROM public.helper_reviews
  WHERE helper_id = _helper_id;

  UPDATE public.helper_details
  SET average_rating = ROUND(_avg, 1),
      total_reviews = _count
  WHERE user_id = _helper_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-recalculate on insert/update/delete
CREATE TRIGGER recalculate_helper_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.helper_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_helper_rating();

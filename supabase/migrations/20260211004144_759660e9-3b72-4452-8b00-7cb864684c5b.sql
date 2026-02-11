
ALTER TABLE public.helper_details
  ADD COLUMN IF NOT EXISTS salary_min integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS salary_max integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_introduction_url text DEFAULT NULL;

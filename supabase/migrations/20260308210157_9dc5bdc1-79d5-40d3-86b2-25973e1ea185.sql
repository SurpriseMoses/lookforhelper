
ALTER TABLE public.helper_details ADD COLUMN video_views integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.track_video_view(helper_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.helper_details
  SET video_views = video_views + 1
  WHERE user_id = helper_user_id;
END;
$$;


-- 1. Add last_active_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT now();

-- 2. Create response_metrics table
CREATE TABLE IF NOT EXISTS public.response_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  avg_response_minutes integer NOT NULL DEFAULT 0,
  response_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.response_metrics ENABLE ROW LEVEL SECURITY;

-- Anyone can read response metrics (public trust signal)
CREATE POLICY "Anyone can read response metrics"
  ON public.response_metrics FOR SELECT
  USING (true);

-- Users can view own
CREATE POLICY "Users can view own response metrics"
  ON public.response_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Create profile_analytics table
CREATE TABLE IF NOT EXISTS public.profile_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  profile_views_last_7_days integer NOT NULL DEFAULT 0,
  search_appearances_last_7_days integer NOT NULL DEFAULT 0,
  messages_received_last_7_days integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_analytics ENABLE ROW LEVEL SECURITY;

-- Only helpers can view their own analytics
CREATE POLICY "Helpers can view own analytics"
  ON public.profile_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Function to update last_active_at
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
  SET last_active_at = now()
  WHERE user_id = auth.uid();
$$;

-- 5. Function to track profile view
CREATE OR REPLACE FUNCTION public.track_profile_view(helper_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profile_analytics (user_id, profile_views_last_7_days)
  VALUES (helper_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    profile_views_last_7_days = profile_analytics.profile_views_last_7_days + 1,
    updated_at = now();
END;
$$;

-- 6. Function to track search appearance (batch)
CREATE OR REPLACE FUNCTION public.track_search_appearances(helper_user_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profile_analytics (user_id, search_appearances_last_7_days)
  SELECT unnest(helper_user_ids), 1
  ON CONFLICT (user_id)
  DO UPDATE SET
    search_appearances_last_7_days = profile_analytics.search_appearances_last_7_days + 1,
    updated_at = now();
END;
$$;

-- 7. Function to track message received
CREATE OR REPLACE FUNCTION public.track_message_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _helper_id uuid;
  _convo RECORD;
BEGIN
  SELECT * INTO _convo FROM public.conversations WHERE id = NEW.conversation_id;
  IF _convo IS NULL THEN RETURN NEW; END IF;
  
  -- Only track when seeker sends first message to helper
  IF _convo.seeker_user_id = NEW.sender_id THEN
    _helper_id := _convo.helper_user_id;
    
    INSERT INTO public.profile_analytics (user_id, messages_received_last_7_days)
    VALUES (_helper_id, 1)
    ON CONFLICT (user_id)
    DO UPDATE SET
      messages_received_last_7_days = profile_analytics.messages_received_last_7_days + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Trigger to track messages received
CREATE TRIGGER on_message_track_analytics
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.track_message_received();

-- 9. Function to calculate response time for helpers
CREATE OR REPLACE FUNCTION public.track_helper_response_time()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _convo RECORD;
  _last_seeker_msg RECORD;
  _diff_minutes integer;
BEGIN
  SELECT * INTO _convo FROM public.conversations WHERE id = NEW.conversation_id;
  IF _convo IS NULL THEN RETURN NEW; END IF;
  
  -- Only track when helper replies
  IF _convo.helper_user_id != NEW.sender_id THEN RETURN NEW; END IF;
  
  -- Find the last seeker message before this reply
  SELECT * INTO _last_seeker_msg
  FROM public.messages
  WHERE conversation_id = NEW.conversation_id
    AND sender_id = _convo.seeker_user_id
    AND created_at < NEW.created_at
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF _last_seeker_msg IS NULL THEN RETURN NEW; END IF;
  
  _diff_minutes := EXTRACT(EPOCH FROM (NEW.created_at - _last_seeker_msg.created_at)) / 60;
  
  INSERT INTO public.response_metrics (user_id, avg_response_minutes, response_count)
  VALUES (_convo.helper_user_id, _diff_minutes, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    avg_response_minutes = ((response_metrics.avg_response_minutes * response_metrics.response_count) + _diff_minutes) / (response_metrics.response_count + 1),
    response_count = response_metrics.response_count + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- 10. Trigger for response time tracking
CREATE TRIGGER on_message_track_response_time
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.track_helper_response_time();

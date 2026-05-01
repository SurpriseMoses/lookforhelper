-- Auto-extend helper trial when profile becomes complete
CREATE OR REPLACE FUNCTION public.extend_trial_on_profile_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _was_complete boolean;
  _is_complete boolean;
  _sub RECORD;
  _new_trial_end timestamptz;
BEGIN
  _was_complete := (
    OLD.skills IS NOT NULL AND array_length(OLD.skills, 1) > 0
    AND OLD.city IS NOT NULL AND length(trim(OLD.city)) > 0
  );
  _is_complete := (
    NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0
    AND NEW.city IS NOT NULL AND length(trim(NEW.city)) > 0
  );

  -- Only act on the transition from incomplete -> complete
  IF _was_complete OR NOT _is_complete THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _sub FROM public.helper_subscriptions WHERE user_id = NEW.user_id;
  IF _sub IS NULL THEN
    RETURN NEW;
  END IF;

  -- Extend by 30 days from now if currently expired or close to expiring
  _new_trial_end := GREATEST(COALESCE(_sub.trial_end, now()), now() + interval '30 days');

  IF _sub.status = 'trial' THEN
    UPDATE public.helper_subscriptions
    SET trial_end = GREATEST(_sub.trial_end, now() + interval '30 days'),
        updated_at = now()
    WHERE user_id = NEW.user_id;

    -- Notify the helper
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'payment_success',
      'Trial extended — 30 days!',
      'Your free trial has been extended by 30 days because you completed your profile. You are now visible in search.',
      '/dashboard'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_extend_trial_on_profile_complete ON public.helper_details;
CREATE TRIGGER trg_extend_trial_on_profile_complete
AFTER UPDATE ON public.helper_details
FOR EACH ROW
EXECUTE FUNCTION public.extend_trial_on_profile_complete();
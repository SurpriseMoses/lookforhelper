
-- Allow new notification types for institutions
CREATE OR REPLACE FUNCTION public.validate_notification_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.type NOT IN ('new_message','interview_request','interview_response','payment_success','verification_approved','verification_rejected','profile_viewed','hire_confirmed','institution_verified','institution_rejected') THEN
    RAISE EXCEPTION 'Invalid notification type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function: notify institution owner on status change
CREATE OR REPLACE FUNCTION public.notify_institution_verification_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    IF NEW.verification_status = 'verified' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'institution_verified', 'Institution verified!',
              'Your institution has been verified. You can now publish courses, gallery and announcements.',
              '/institution-dashboard');
    ELSIF NEW.verification_status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.user_id, 'institution_rejected', 'Institution verification not approved',
              COALESCE(NEW.rejection_reason, 'Please review your documents and resubmit.'),
              '/institution-dashboard');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_institution_verification ON public.institutions;
CREATE TRIGGER trg_notify_institution_verification
AFTER UPDATE ON public.institutions
FOR EACH ROW
EXECUTE FUNCTION public.notify_institution_verification_result();


-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Service role inserts only (via triggers)
-- No INSERT policy for regular users

-- Add index for fast lookups
CREATE INDEX idx_notifications_user_id ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications (user_id, read) WHERE read = false;

-- Validate notification type
CREATE OR REPLACE FUNCTION public.validate_notification_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.type NOT IN ('new_message', 'interview_request', 'interview_response', 'payment_success', 'verification_approved', 'verification_rejected', 'profile_viewed', 'hire_confirmed') THEN
    RAISE EXCEPTION 'Invalid notification type: %', NEW.type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_notification_type_trigger
BEFORE INSERT OR UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.validate_notification_type();

-- Trigger: Notify on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _recipient_id UUID;
  _sender_name TEXT;
  _convo RECORD;
BEGIN
  -- Get conversation to find recipient
  SELECT * INTO _convo FROM public.conversations WHERE id = NEW.conversation_id;
  IF _convo IS NULL THEN RETURN NEW; END IF;

  -- Recipient is the other party
  IF _convo.seeker_user_id = NEW.sender_id THEN
    _recipient_id := _convo.helper_user_id;
  ELSE
    _recipient_id := _convo.seeker_user_id;
  END IF;

  -- Get sender name
  SELECT full_name INTO _sender_name FROM public.profiles WHERE user_id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    _recipient_id,
    'new_message',
    'New message from ' || COALESCE(_sender_name, 'someone'),
    LEFT(NEW.content, 100),
    '/messages?conversation=' || NEW.conversation_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_new_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();

-- Trigger: Notify on interview request
CREATE OR REPLACE FUNCTION public.notify_interview_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _seeker_name TEXT;
BEGIN
  SELECT full_name INTO _seeker_name FROM public.profiles WHERE user_id = NEW.seeker_user_id;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.helper_user_id,
    'interview_request',
    'Interview request from ' || COALESCE(_seeker_name, 'a seeker'),
    COALESCE(NEW.seeker_message, 'You have a new interview request'),
    '/interviews'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_interview_request_trigger
AFTER INSERT ON public.interviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_interview_request();

-- Trigger: Notify on interview status change (accepted/declined)
CREATE OR REPLACE FUNCTION public.notify_interview_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _helper_name TEXT;
  _status_text TEXT;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('accepted', 'declined') THEN RETURN NEW; END IF;

  SELECT full_name INTO _helper_name FROM public.profiles WHERE user_id = NEW.helper_user_id;
  _status_text := CASE WHEN NEW.status = 'accepted' THEN 'accepted' ELSE 'declined' END;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.seeker_user_id,
    'interview_response',
    COALESCE(_helper_name, 'A helper') || ' ' || _status_text || ' your interview',
    COALESCE(NEW.helper_response, ''),
    '/interviews'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_interview_response_trigger
AFTER UPDATE ON public.interviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_interview_response();

-- Trigger: Notify on hire confirmation
CREATE OR REPLACE FUNCTION public.notify_hire_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.confirmed_at IS NOT NULL AND (OLD.confirmed_at IS NULL) THEN
    -- Notify both parties
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES
      (NEW.seeker_user_id, 'hire_confirmed', 'Hire confirmed!', 'Both parties have confirmed the hire.', '/interviews'),
      (NEW.helper_user_id, 'hire_confirmed', 'Hire confirmed!', 'Both parties have confirmed the hire.', '/interviews');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_hire_confirmed_trigger
AFTER UPDATE ON public.job_hires
FOR EACH ROW
EXECUTE FUNCTION public.notify_hire_confirmed();

-- Trigger: Notify seeker on payment success
CREATE OR REPLACE FUNCTION public.notify_seeker_payment_success()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'payment_success',
      'Messaging unlocked!',
      'Your R25 messaging plan is now active for 30 days.',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_seeker_payment_success_trigger
AFTER UPDATE ON public.seeker_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.notify_seeker_payment_success();

-- Trigger: Notify on verification approved/rejected
CREATE OR REPLACE FUNCTION public.notify_verification_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  IF NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'verification_approved', 'Verification approved!', 'Your identity has been verified. Your profile now shows a verified badge.', '/dashboard');
  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'verification_rejected', 'Verification not approved', COALESCE(NEW.rejection_reason, 'Please resubmit with valid documents.'), '/dashboard');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_verification_result_trigger
AFTER UPDATE ON public.verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_verification_result();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

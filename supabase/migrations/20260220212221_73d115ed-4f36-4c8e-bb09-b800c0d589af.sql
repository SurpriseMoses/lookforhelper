
-- Add amount and payment_reference to seeker_subscriptions
ALTER TABLE public.seeker_subscriptions
  ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Drop old validation trigger and function, recreate with new statuses
DROP TRIGGER IF EXISTS validate_seeker_subscription_status_trigger ON public.seeker_subscriptions;

CREATE OR REPLACE FUNCTION public.validate_seeker_subscription_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('free', 'active', 'cancelled', 'expired', 'pending', 'failed') THEN
    RAISE EXCEPTION 'Invalid seeker subscription status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_seeker_subscription_status_trigger
  BEFORE INSERT OR UPDATE ON public.seeker_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_seeker_subscription_status();

-- Admin can view all seeker subscriptions
CREATE POLICY "Admins can view all seeker subscriptions"
  ON public.seeker_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

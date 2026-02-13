
-- Create helper_subscriptions table
CREATE TABLE public.helper_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'trial',
  trial_start timestamp with time zone NOT NULL DEFAULT now(),
  trial_end timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add constraint for valid statuses
CREATE OR REPLACE FUNCTION public.validate_subscription_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('trial', 'active', 'expired', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid subscription status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_subscription_status_trigger
BEFORE INSERT OR UPDATE ON public.helper_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.validate_subscription_status();

-- Updated_at trigger
CREATE TRIGGER update_helper_subscriptions_updated_at
BEFORE UPDATE ON public.helper_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.helper_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own subscription"
ON public.helper_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Published subscription viewable for search"
ON public.helper_subscriptions FOR SELECT
USING (status IN ('trial', 'active'));

-- Auto-create trial subscription when helper_details is created
CREATE OR REPLACE FUNCTION public.handle_new_helper_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.helper_subscriptions (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_helper_details_created
AFTER INSERT ON public.helper_details
FOR EACH ROW EXECUTE FUNCTION public.handle_new_helper_subscription();

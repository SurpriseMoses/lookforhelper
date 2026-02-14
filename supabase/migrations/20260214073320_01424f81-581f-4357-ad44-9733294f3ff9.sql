
-- Create seeker_subscriptions table
CREATE TABLE public.seeker_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'free',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Validate status
CREATE OR REPLACE FUNCTION public.validate_seeker_subscription_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('free', 'active', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'Invalid seeker subscription status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_seeker_sub_status
BEFORE INSERT OR UPDATE ON public.seeker_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.validate_seeker_subscription_status();

-- Auto-create seeker subscription on role creation
CREATE OR REPLACE FUNCTION public.handle_new_seeker_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'seeker' THEN
    INSERT INTO public.seeker_subscriptions (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_seeker_role_created
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_seeker_subscription();

-- Updated_at trigger
CREATE TRIGGER update_seeker_subscriptions_updated_at
BEFORE UPDATE ON public.seeker_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.seeker_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own subscription
CREATE POLICY "Users can view own seeker subscription"
ON public.seeker_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Backfill existing seekers
INSERT INTO public.seeker_subscriptions (user_id)
SELECT ur.user_id FROM public.user_roles ur
WHERE ur.role = 'seeker'
ON CONFLICT (user_id) DO NOTHING;

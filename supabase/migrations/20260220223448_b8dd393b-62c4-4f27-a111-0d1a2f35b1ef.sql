
-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  reward_given BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT referrals_unique_referred UNIQUE (referred_user_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;

-- Trigger: when a verification_request is approved, reward the referrer with 3-day featured boost
CREATE OR REPLACE FUNCTION public.reward_referrer_on_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _referrer_id UUID;
  _current_until TIMESTAMPTZ;
  _new_until TIMESTAMPTZ;
BEGIN
  -- Only fire when status changes to 'approved'
  IF OLD.status = NEW.status OR NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  -- Find a referral for this verified user that hasn't been rewarded
  SELECT referrer_id INTO _referrer_id
  FROM public.referrals
  WHERE referred_user_id = NEW.user_id AND reward_given = false
  LIMIT 1;

  IF _referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculate new featured_until (extend if already featured, otherwise from now)
  SELECT featured_until INTO _current_until
  FROM public.helper_details
  WHERE user_id = _referrer_id;

  IF _current_until IS NOT NULL AND _current_until > now() THEN
    _new_until := _current_until + interval '3 days';
  ELSE
    _new_until := now() + interval '3 days';
  END IF;

  -- Grant 3-day featured boost to referrer
  UPDATE public.helper_details
  SET is_featured = true,
      featured_status = 'active',
      featured_until = _new_until
  WHERE user_id = _referrer_id;

  -- Mark referral as rewarded
  UPDATE public.referrals
  SET reward_given = true
  WHERE referred_user_id = NEW.user_id AND reward_given = false;

  -- Notify the referrer
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    _referrer_id,
    'payment_success',
    'Referral reward earned!',
    'Your referral completed verification. You got a 3-day Featured Boost!',
    '/dashboard'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER reward_referrer_trigger
  AFTER UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.reward_referrer_on_verification();

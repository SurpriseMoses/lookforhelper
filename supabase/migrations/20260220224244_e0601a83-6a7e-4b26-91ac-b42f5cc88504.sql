
-- Add referral_code and status columns to referrals table
ALTER TABLE public.referrals 
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Add referral_code and referred_by to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by text;

-- Validate referral status
CREATE OR REPLACE FUNCTION public.validate_referral_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'completed') THEN
    RAISE EXCEPTION 'Invalid referral status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_referral_status_trigger
  BEFORE INSERT OR UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_referral_status();

-- Auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _code text;
  _exists boolean;
BEGIN
  LOOP
    _code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = _code) INTO _exists;
    EXIT WHEN NOT _exists;
  END LOOP;
  NEW.referral_code := _code;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_referral_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Backfill existing profiles with referral codes
DO $$
DECLARE
  _profile RECORD;
  _code text;
  _exists boolean;
BEGIN
  FOR _profile IN SELECT id FROM public.profiles WHERE referral_code IS NULL LOOP
    LOOP
      _code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = _code) INTO _exists;
      EXIT WHEN NOT _exists;
    END LOOP;
    UPDATE public.profiles SET referral_code = _code WHERE id = _profile.id;
  END LOOP;
END;
$$;

-- Admin can view all referrals
CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seeker reward trigger: when referred seeker buys messaging plan, extend referrer by 7 days
CREATE OR REPLACE FUNCTION public.reward_seeker_referrer_on_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _referrer_id UUID;
  _current_end TIMESTAMPTZ;
  _new_end TIMESTAMPTZ;
BEGIN
  -- Only fire when status changes to 'active'
  IF OLD.status = NEW.status OR NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  -- Find a pending referral for this user
  SELECT referrer_id INTO _referrer_id
  FROM public.referrals
  WHERE referred_user_id = NEW.user_id AND reward_given = false AND status = 'pending'
  LIMIT 1;

  IF _referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Extend referrer's seeker subscription by 7 days
  SELECT current_period_end INTO _current_end
  FROM public.seeker_subscriptions
  WHERE user_id = _referrer_id AND status = 'active';

  IF _current_end IS NOT NULL AND _current_end > now() THEN
    _new_end := _current_end + interval '7 days';
  ELSE
    _new_end := now() + interval '7 days';
  END IF;

  UPDATE public.seeker_subscriptions
  SET current_period_end = _new_end,
      status = 'active',
      current_period_start = COALESCE(current_period_start, now())
  WHERE user_id = _referrer_id;

  -- Mark referral as completed
  UPDATE public.referrals
  SET reward_given = true, status = 'completed'
  WHERE referred_user_id = NEW.user_id AND reward_given = false AND status = 'pending';

  -- Notify the referrer
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    _referrer_id,
    'payment_success',
    'Referral reward earned!',
    'Your referral purchased a Messaging Plan. You got 7 extra days of messaging!',
    '/dashboard'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER reward_seeker_referrer_trigger
  AFTER UPDATE ON public.seeker_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.reward_seeker_referrer_on_subscription();

-- Update existing helper referral trigger to also set status = 'completed'
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
  IF OLD.status = NEW.status OR NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  SELECT referrer_id INTO _referrer_id
  FROM public.referrals
  WHERE referred_user_id = NEW.user_id AND reward_given = false
  LIMIT 1;

  IF _referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT featured_until INTO _current_until
  FROM public.helper_details
  WHERE user_id = _referrer_id;

  IF _current_until IS NOT NULL AND _current_until > now() THEN
    _new_until := _current_until + interval '3 days';
  ELSE
    _new_until := now() + interval '3 days';
  END IF;

  UPDATE public.helper_details
  SET is_featured = true,
      featured_status = 'active',
      featured_until = _new_until
  WHERE user_id = _referrer_id;

  UPDATE public.referrals
  SET reward_given = true, status = 'completed'
  WHERE referred_user_id = NEW.user_id AND reward_given = false;

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

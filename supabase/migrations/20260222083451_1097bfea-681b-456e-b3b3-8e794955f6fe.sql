
-- Add featured listing fields to helper_subscriptions
ALTER TABLE public.helper_subscriptions
  ADD COLUMN IF NOT EXISTS featured_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS featured_cancelled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_cancelled_at timestamp with time zone;

-- Set featured_active = true for currently active subscriptions
UPDATE public.helper_subscriptions
SET featured_active = true,
    featured_expires_at = current_period_end
WHERE status = 'active' AND current_period_end > now();

-- Set featured_active = true for trial users still within trial
UPDATE public.helper_subscriptions
SET featured_active = true,
    featured_expires_at = trial_end
WHERE status = 'trial' AND trial_end > now();

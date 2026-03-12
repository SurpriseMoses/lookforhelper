
-- 1. Create countries configuration table
CREATE TABLE public.countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL UNIQUE,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  phone_prefix TEXT NOT NULL DEFAULT '+27',
  default_language TEXT NOT NULL DEFAULT 'English',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active countries"
  ON public.countries FOR SELECT
  TO public
  USING (true);

-- Insert South Africa as default active country
INSERT INTO public.countries (country_name, country_code, currency, phone_prefix, default_language, is_active)
VALUES ('South Africa', 'ZA', 'ZAR', '+27', 'English', true);

-- Insert future expansion countries (inactive)
INSERT INTO public.countries (country_name, country_code, currency, phone_prefix, default_language, is_active)
VALUES 
  ('Kenya', 'KE', 'KES', '+254', 'English', false),
  ('Nigeria', 'NG', 'NGN', '+234', 'English', false);

-- 2. Add province to helper_details
ALTER TABLE public.helper_details ADD COLUMN IF NOT EXISTS province TEXT DEFAULT '';

-- 3. Add phone_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT NULL;

-- 4. Add currency and country to payment tables
ALTER TABLE public.seeker_subscriptions 
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ZAR',
  ADD COLUMN IF NOT EXISTS payment_country TEXT DEFAULT 'South Africa',
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'Paystack';

ALTER TABLE public.verification_payments
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ZAR',
  ADD COLUMN IF NOT EXISTS payment_country TEXT DEFAULT 'South Africa',
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'Paystack';

ALTER TABLE public.featured_payments
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ZAR',
  ADD COLUMN IF NOT EXISTS payment_country TEXT DEFAULT 'South Africa',
  ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'Paystack';

-- 5. Backfill province for existing helpers using cities table
UPDATE public.helper_details hd
SET province = c.province
FROM public.cities c
WHERE LOWER(hd.city) = LOWER(c.city_name)
  AND (hd.province IS NULL OR hd.province = '');

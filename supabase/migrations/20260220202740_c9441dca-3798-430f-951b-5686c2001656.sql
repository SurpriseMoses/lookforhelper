
-- Add featured boost columns to helper_details
ALTER TABLE public.helper_details
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamp with time zone,
  ADD COLUMN IF NOT EXISTS featured_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS featured_type text;

-- Validate featured_status values
CREATE OR REPLACE FUNCTION public.validate_featured_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.featured_status NOT IN ('none', 'active', 'expired') THEN
    RAISE EXCEPTION 'Invalid featured status: %', NEW.featured_status;
  END IF;
  IF NEW.featured_type IS NOT NULL AND NEW.featured_type NOT IN ('7_days', '30_days') THEN
    RAISE EXCEPTION 'Invalid featured type: %', NEW.featured_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_featured_status_trigger
  BEFORE INSERT OR UPDATE ON public.helper_details
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_featured_status();

-- Create featured_payments table
CREATE TABLE public.featured_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  plan text NOT NULL,
  payment_reference text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.featured_payments ENABLE ROW LEVEL SECURITY;

-- RLS: users can view own payments
CREATE POLICY "Users can view own featured payments"
  ON public.featured_payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: helpers can create own payments (via edge function using service role, but also allow client insert)
CREATE POLICY "Helpers can create own featured payments"
  ON public.featured_payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'helper'::app_role));

-- RLS: admins can view all
CREATE POLICY "Admins can view all featured payments"
  ON public.featured_payments
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Validate featured payment status
CREATE OR REPLACE FUNCTION public.validate_featured_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'paid', 'failed') THEN
    RAISE EXCEPTION 'Invalid featured payment status: %', NEW.status;
  END IF;
  IF NEW.plan NOT IN ('7_days', '30_days') THEN
    RAISE EXCEPTION 'Invalid featured plan: %', NEW.plan;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_featured_payment_status_trigger
  BEFORE INSERT OR UPDATE ON public.featured_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_featured_payment_status();

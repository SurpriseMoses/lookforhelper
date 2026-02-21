
-- Update validate_hire_status to support 'ended' status
CREATE OR REPLACE FUNCTION public.validate_hire_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('pending', 'confirmed', 'ended') THEN
    RAISE EXCEPTION 'Invalid hire status: %', NEW.status;
  END IF;
  -- Auto-confirm when both parties confirm
  IF NEW.confirmed_by_helper = true AND NEW.confirmed_by_seeker = true AND NEW.confirmed_at IS NULL THEN
    NEW.status := 'confirmed';
    NEW.confirmed_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- Add ended_at column to hires table
ALTER TABLE public.hires ADD COLUMN IF NOT EXISTS ended_at timestamp with time zone DEFAULT NULL;

-- Update validate_featured_status to support 21_days
CREATE OR REPLACE FUNCTION public.validate_featured_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.featured_status NOT IN ('none', 'active', 'expired') THEN
    RAISE EXCEPTION 'Invalid featured status: %', NEW.featured_status;
  END IF;
  IF NEW.featured_type IS NOT NULL AND NEW.featured_type NOT IN ('7_days', '21_days', '30_days') THEN
    RAISE EXCEPTION 'Invalid featured type: %', NEW.featured_type;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update validate_featured_payment_status to support 21_days
CREATE OR REPLACE FUNCTION public.validate_featured_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('pending', 'paid', 'failed') THEN
    RAISE EXCEPTION 'Invalid featured payment status: %', NEW.status;
  END IF;
  IF NEW.plan NOT IN ('7_days', '21_days', '30_days') THEN
    RAISE EXCEPTION 'Invalid featured plan: %', NEW.plan;
  END IF;
  RETURN NEW;
END;
$function$;

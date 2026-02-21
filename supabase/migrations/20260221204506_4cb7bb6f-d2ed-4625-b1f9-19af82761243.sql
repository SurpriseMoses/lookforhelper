
-- Add availability fields to helper_details
ALTER TABLE public.helper_details
ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'not_available',
ADD COLUMN IF NOT EXISTS available_from date,
ADD COLUMN IF NOT EXISTS work_type text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS preferred_hours text;

-- Validation trigger for availability fields
CREATE OR REPLACE FUNCTION public.validate_availability_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.availability_status NOT IN ('available_now', 'available_soon', 'not_available') THEN
    RAISE EXCEPTION 'Invalid availability status: %', NEW.availability_status;
  END IF;
  -- Validate work_type array values
  IF NEW.work_type IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM unnest(NEW.work_type) AS wt
      WHERE wt NOT IN ('full_time', 'part_time', 'live_in', 'live_out', 'temporary')
    ) THEN
      RAISE EXCEPTION 'Invalid work type value in array';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_availability_status_trigger
BEFORE INSERT OR UPDATE ON public.helper_details
FOR EACH ROW
EXECUTE FUNCTION public.validate_availability_status();

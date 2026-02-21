
-- Add background check fields to helper_details
ALTER TABLE public.helper_details
ADD COLUMN background_check_status text NOT NULL DEFAULT 'not_available',
ADD COLUMN background_check_requested boolean NOT NULL DEFAULT false,
ADD COLUMN background_check_available boolean NOT NULL DEFAULT false;

-- Validation trigger
CREATE OR REPLACE FUNCTION public.validate_background_check_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.background_check_status NOT IN ('not_available', 'pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid background check status: %', NEW.background_check_status;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_background_check_status_trigger
BEFORE INSERT OR UPDATE ON public.helper_details
FOR EACH ROW
EXECUTE FUNCTION public.validate_background_check_status();


ALTER TABLE public.interviews
ADD COLUMN meeting_method text NULL;

-- Update validation trigger to also validate meeting_method
CREATE OR REPLACE FUNCTION public.validate_interview_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status NOT IN ('pending', 'accepted', 'declined', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid interview status: %', NEW.status;
  END IF;
  IF NEW.interview_type NOT IN ('video', 'in_person') THEN
    RAISE EXCEPTION 'Invalid interview type: %', NEW.interview_type;
  END IF;
  IF NEW.meeting_method IS NOT NULL AND NEW.meeting_method NOT IN ('whatsapp', 'phone', 'google_meet') THEN
    RAISE EXCEPTION 'Invalid meeting method: %', NEW.meeting_method;
  END IF;
  RETURN NEW;
END;
$function$;

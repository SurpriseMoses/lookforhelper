
-- Helper photos table for gallery
CREATE TABLE public.helper_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.helper_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Helpers can insert own photos" ON public.helper_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'helper'));

CREATE POLICY "Helpers can delete own photos" ON public.helper_photos
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view helper photos" ON public.helper_photos
  FOR SELECT USING (true);

-- Disputes table
CREATE TABLE public.disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  other_party_id UUID NOT NULL,
  hire_id UUID REFERENCES public.hires(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create disputes" ON public.disputes
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own disputes" ON public.disputes
  FOR SELECT USING (auth.uid() = reporter_id OR auth.uid() = other_party_id);

CREATE POLICY "Admins can view all disputes" ON public.disputes
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update disputes" ON public.disputes
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Validate dispute status
CREATE OR REPLACE FUNCTION public.validate_dispute_status()
  RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('open', 'investigating', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'Invalid dispute status: %', NEW.status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_dispute_status_trigger
  BEFORE INSERT OR UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.validate_dispute_status();

-- Saved searches table
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Search',
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  notify_new_matches BOOLEAN NOT NULL DEFAULT true,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved searches" ON public.saved_searches
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

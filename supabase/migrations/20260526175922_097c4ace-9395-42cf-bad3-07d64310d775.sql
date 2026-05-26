
-- =========================================================
-- INSTITUTIONS SYSTEM
-- =========================================================

-- 1. Extend app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'institution';

-- =========================================================
-- 2. TABLES
-- =========================================================

-- institutions
CREATE TABLE public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  institution_name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  country text NOT NULL DEFAULT 'South Africa',
  city text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  website text DEFAULT '',
  facebook_url text DEFAULT '',
  instagram_url text DEFAULT '',
  tiktok_url text DEFAULT '',
  logo_url text,
  banner_url text,
  registration_number text DEFAULT '',
  registration_document_url text,
  verification_status text NOT NULL DEFAULT 'pending',
  verification_paid boolean NOT NULL DEFAULT false,
  rejection_reason text,
  verified_at timestamptz,
  is_suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.institutions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.institutions TO authenticated;
GRANT ALL ON public.institutions TO service_role;

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified non-suspended institutions"
ON public.institutions FOR SELECT
USING (
  (verification_status = 'verified' AND is_suspended = false)
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Owners can insert their institution"
ON public.institutions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their institution"
ON public.institutions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any institution"
ON public.institutions FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Validation: verification_status enum-ish
CREATE OR REPLACE FUNCTION public.validate_institution_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.verification_status NOT IN ('pending','verified','rejected') THEN
    RAISE EXCEPTION 'Invalid institution verification status: %', NEW.verification_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_institutions_validate_status
BEFORE INSERT OR UPDATE ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.validate_institution_verification_status();

CREATE TRIGGER trg_institutions_updated_at
BEFORE UPDATE ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_institutions_country_city ON public.institutions(country, city);
CREATE INDEX idx_institutions_verification ON public.institutions(verification_status);

-- Helper: is verified institution
CREATE OR REPLACE FUNCTION public.is_verified_institution(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institutions
    WHERE user_id = _user_id
      AND verification_status = 'verified'
      AND is_suspended = false
  )
$$;

-- institution_courses
CREATE TABLE public.institution_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  course_name text NOT NULL,
  category text NOT NULL DEFAULT 'Other',
  duration text DEFAULT '',
  fee numeric DEFAULT 0,
  currency text NOT NULL DEFAULT 'ZAR',
  certificate_included boolean NOT NULL DEFAULT false,
  installments_available boolean NOT NULL DEFAULT false,
  requirements text DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.institution_courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_courses TO authenticated;
GRANT ALL ON public.institution_courses TO service_role;

ALTER TABLE public.institution_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses of verified institutions"
ON public.institution_courses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.institutions i
    WHERE i.id = institution_courses.institution_id
      AND (
        (i.verification_status = 'verified' AND i.is_suspended = false)
        OR i.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

CREATE POLICY "Verified institution owners can manage courses"
ON public.institution_courses FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.institutions i
    WHERE i.id = institution_courses.institution_id
      AND i.user_id = auth.uid()
      AND i.verification_status = 'verified'
  )
);

CREATE POLICY "Owners can update own courses"
ON public.institution_courses FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = institution_courses.institution_id AND i.user_id = auth.uid())
);

CREATE POLICY "Owners can delete own courses"
ON public.institution_courses FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = institution_courses.institution_id AND i.user_id = auth.uid())
);

CREATE TRIGGER trg_institution_courses_updated_at
BEFORE UPDATE ON public.institution_courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_institution_courses_inst ON public.institution_courses(institution_id);
CREATE INDEX idx_institution_courses_category ON public.institution_courses(category);

-- institution_gallery
CREATE TABLE public.institution_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.institution_gallery TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_gallery TO authenticated;
GRANT ALL ON public.institution_gallery TO service_role;

ALTER TABLE public.institution_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery of verified institutions"
ON public.institution_gallery FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.institutions i
    WHERE i.id = institution_gallery.institution_id
      AND (
        (i.verification_status = 'verified' AND i.is_suspended = false)
        OR i.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

CREATE POLICY "Verified owners can insert gallery"
ON public.institution_gallery FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.institutions i
    WHERE i.id = institution_gallery.institution_id
      AND i.user_id = auth.uid()
      AND i.verification_status = 'verified'
  )
);

CREATE POLICY "Owners can delete own gallery"
ON public.institution_gallery FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = institution_gallery.institution_id AND i.user_id = auth.uid())
);

CREATE POLICY "Owners can update own gallery"
ON public.institution_gallery FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = institution_gallery.institution_id AND i.user_id = auth.uid())
);

CREATE INDEX idx_institution_gallery_inst ON public.institution_gallery(institution_id);

-- institution_announcements
CREATE TABLE public.institution_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title text NOT NULL,
  caption text DEFAULT '',
  image_url text,
  is_paid boolean NOT NULL DEFAULT false,
  payment_reference text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.institution_announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_announcements TO authenticated;
GRANT ALL ON public.institution_announcements TO service_role;

ALTER TABLE public.institution_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active announcements of verified institutions"
ON public.institution_announcements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.institutions i
    WHERE i.id = institution_announcements.institution_id
      AND (
        (i.verification_status = 'verified' AND i.is_suspended = false AND institution_announcements.expires_at > now())
        OR i.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
  )
);

CREATE POLICY "Verified owners can create announcements"
ON public.institution_announcements FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.institutions i
    WHERE i.id = institution_announcements.institution_id
      AND i.user_id = auth.uid()
      AND i.verification_status = 'verified'
  )
);

CREATE POLICY "Owners can delete own announcements"
ON public.institution_announcements FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.institutions i WHERE i.id = institution_announcements.institution_id AND i.user_id = auth.uid())
);

CREATE POLICY "Admins can delete any announcement"
ON public.institution_announcements FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_inst_announcements_inst ON public.institution_announcements(institution_id);
CREATE INDEX idx_inst_announcements_expires ON public.institution_announcements(expires_at);

-- institution_payments
CREATE TABLE public.institution_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  payment_type text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_reference text,
  payment_provider text NOT NULL DEFAULT 'Paystack',
  payment_country text DEFAULT 'South Africa',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.institution_payments TO authenticated;
GRANT ALL ON public.institution_payments TO service_role;

ALTER TABLE public.institution_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own institution payments"
ON public.institution_payments FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all institution payments"
ON public.institution_payments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.validate_institution_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_type NOT IN ('verification','extra_announcement') THEN
    RAISE EXCEPTION 'Invalid institution payment type: %', NEW.payment_type;
  END IF;
  IF NEW.payment_status NOT IN ('pending','paid','failed') THEN
    RAISE EXCEPTION 'Invalid institution payment status: %', NEW.payment_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inst_payment_validate
BEFORE INSERT OR UPDATE ON public.institution_payments
FOR EACH ROW EXECUTE FUNCTION public.validate_institution_payment();

-- saved_institutions
CREATE TABLE public.saved_institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_id uuid NOT NULL,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(helper_id, institution_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_institutions TO authenticated;
GRANT ALL ON public.saved_institutions TO service_role;

ALTER TABLE public.saved_institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved institutions"
ON public.saved_institutions FOR SELECT TO authenticated
USING (auth.uid() = helper_id);

CREATE POLICY "Users can save institutions"
ON public.saved_institutions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = helper_id);

CREATE POLICY "Users can unsave institutions"
ON public.saved_institutions FOR DELETE TO authenticated
USING (auth.uid() = helper_id);

-- =========================================================
-- 3. AUTO-CREATE INSTITUTION ROW ON SIGNUP
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_institution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'institution' THEN
    INSERT INTO public.institutions (user_id, institution_name, email)
    SELECT NEW.user_id,
           COALESCE(p.full_name, ''),
           COALESCE((au.raw_user_meta_data->>'email')::text, au.email)
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.user_id = NEW.user_id
    WHERE au.id = NEW.user_id
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_institution
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_new_institution();

-- =========================================================
-- 4. STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('institution-logos', 'institution-logos', true),
  ('institution-banners', 'institution-banners', true),
  ('institution-gallery', 'institution-gallery', true),
  ('institution-announcements', 'institution-announcements', true),
  ('institution-documents', 'institution-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Public buckets: read for all; owners write to a folder prefixed by their user id
CREATE POLICY "Public read institution logos"
ON storage.objects FOR SELECT USING (bucket_id = 'institution-logos');
CREATE POLICY "Owners upload institution logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'institution-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners update institution logos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'institution-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners delete institution logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'institution-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read institution banners"
ON storage.objects FOR SELECT USING (bucket_id = 'institution-banners');
CREATE POLICY "Owners upload institution banners"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'institution-banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners update institution banners"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'institution-banners' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners delete institution banners"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'institution-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read institution gallery"
ON storage.objects FOR SELECT USING (bucket_id = 'institution-gallery');
CREATE POLICY "Owners upload institution gallery"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'institution-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners delete institution gallery"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'institution-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read institution announcements"
ON storage.objects FOR SELECT USING (bucket_id = 'institution-announcements');
CREATE POLICY "Owners upload institution announcements"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'institution-announcements' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners delete institution announcements"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'institution-announcements' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Private documents: only owner and admins can read; owners upload
CREATE POLICY "Owners read own institution documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'institution-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all institution documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'institution-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners upload institution documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'institution-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners delete institution documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'institution-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

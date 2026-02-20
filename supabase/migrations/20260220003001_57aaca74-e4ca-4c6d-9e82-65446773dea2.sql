
-- Verification payments table
CREATE TABLE public.verification_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 49.00,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification payments"
  ON public.verification_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verification payments"
  ON public.verification_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'helper'));

CREATE POLICY "Admins can view all verification payments"
  ON public.verification_payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Validate payment status
CREATE OR REPLACE FUNCTION public.validate_verification_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'paid', 'failed') THEN
    RAISE EXCEPTION 'Invalid payment status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_verification_payment_status_trigger
  BEFORE INSERT OR UPDATE ON public.verification_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_verification_payment_status();

-- Verification requests table
CREATE TABLE public.verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payment_id UUID NOT NULL REFERENCES public.verification_payments(id),
  document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Helpers can view own verification requests"
  ON public.verification_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Helpers can create verification requests"
  ON public.verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'helper'));

CREATE POLICY "Helpers can update own pending requests"
  ON public.verification_requests FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'rejected'));

CREATE POLICY "Admins can view all verification requests"
  ON public.verification_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verification requests"
  ON public.verification_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Validate verification request status
CREATE OR REPLACE FUNCTION public.validate_verification_request_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid verification request status: %', NEW.status;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_verification_request_status_trigger
  BEFORE INSERT OR UPDATE ON public.verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_verification_request_status();

-- Private storage bucket for identity documents (only admins can view)
INSERT INTO storage.buckets (id, name, public) VALUES ('identity-documents', 'identity-documents', false);

-- Only the uploader can upload their own documents
CREATE POLICY "Helpers can upload own identity documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'identity-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Only admins can view documents
CREATE POLICY "Admins can view identity documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'identity-documents' AND has_role(auth.uid(), 'admin'));

-- Allow helpers to view their own uploaded documents
CREATE POLICY "Helpers can view own identity documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'identity-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

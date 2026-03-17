
-- Add new columns to verification_requests for enhanced verification
ALTER TABLE public.verification_requests
  ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'sa_id',
  ADD COLUMN IF NOT EXISTS selfie_url text,
  ADD COLUMN IF NOT EXISTS country_of_origin text,
  ADD COLUMN IF NOT EXISTS document_number text,
  ADD COLUMN IF NOT EXISTS expiry_date date;

-- Create selfie storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-selfies', 'verification-selfies', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for selfie bucket: users can upload own selfies
CREATE POLICY "Users can upload own selfies"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-selfies' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all selfies
CREATE POLICY "Admins can view selfies"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-selfies' AND public.has_role(auth.uid(), 'admin'));

-- Users can view own selfies
CREATE POLICY "Users can view own selfies"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-selfies' AND (storage.foldername(name))[1] = auth.uid()::text);


-- Create storage bucket for helper introduction videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('helper-videos', 'helper-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow helpers to upload their own videos
CREATE POLICY "Helpers can upload their own videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'helper-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow helpers to update their own videos
CREATE POLICY "Helpers can update their own videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'helper-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow helpers to delete their own videos
CREATE POLICY "Helpers can delete their own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'helper-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to helper videos
CREATE POLICY "Helper videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'helper-videos');

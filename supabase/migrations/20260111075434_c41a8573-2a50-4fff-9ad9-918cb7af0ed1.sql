-- Fix character-images storage bucket security
-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'character-images';

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow public access to character images" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to character images" ON storage.objects;

-- Create secure user-scoped policies
-- Users can view their own character images (files stored in user-id/filename.jpg format)
CREATE POLICY "Users can view their own character images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'character-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can upload their own character images
CREATE POLICY "Users can upload their own character images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'character-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own character images
CREATE POLICY "Users can update their own character images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'character-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own character images
CREATE POLICY "Users can delete their own character images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'character-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all character images for moderation
CREATE POLICY "Admins can view all character images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'character-images' AND public.is_admin(auth.uid()));
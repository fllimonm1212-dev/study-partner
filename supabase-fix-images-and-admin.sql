-- Create storage buckets for avatars and feedback images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true), ('feedback_images', 'feedback_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'avatars' bucket
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND 
  auth.uid() = owner
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND 
  auth.uid() = owner
);

-- Storage policies for the 'feedback_images' bucket
CREATE POLICY "Anyone can view feedback images"
ON storage.objects FOR SELECT
USING (bucket_id = 'feedback_images');

CREATE POLICY "Authenticated users can upload feedback images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feedback_images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Only admins can delete feedback images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'feedback_images' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Ensure the user is an admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'fllimonm1212@gmail.com';

-- Ensure profiles are publicly readable for the leaderboard
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

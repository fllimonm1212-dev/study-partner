-- 1. Set Admin Role
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'fllimonm1212@gmail.com';

-- 2. Create Storage Buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('feedback_images', 'feedback_images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies for avatars
CREATE POLICY "Avatar images are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- 4. Storage Policies for feedback_images
CREATE POLICY "Feedback images are readable by admins" ON storage.objects
  FOR SELECT USING (bucket_id = 'feedback_images');

CREATE POLICY "Users can upload feedback images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'feedback_images');

-- 5. Profiles RLS Policies
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
CREATE POLICY "Profiles are publicly readable" ON public.profiles
  FOR SELECT USING (true);

-- 6. Exam Submissions RLS Policies
DROP POLICY IF EXISTS "Anyone can see completed submissions (leaderboard)" ON public.exam_submissions;
CREATE POLICY "Anyone can see completed submissions (leaderboard)" ON public.exam_submissions
  FOR SELECT USING (status = 'completed');

DROP POLICY IF EXISTS "Users can see their own submissions" ON public.exam_submissions;
CREATE POLICY "Users can see their own submissions" ON public.exam_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all submissions" ON public.exam_submissions;
CREATE POLICY "Admins can read all submissions" ON public.exam_submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Exams RLS Policies
DROP POLICY IF EXISTS "Exams are readable by everyone" ON public.exams;
CREATE POLICY "Exams are readable by everyone" ON public.exams
  FOR SELECT USING (true);

-- 8. Feedback RLS Policies
DROP POLICY IF EXISTS "Feedback is readable by admins only" ON public.feedback;
CREATE POLICY "Feedback is readable by admins only" ON public.feedback
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback;
CREATE POLICY "Users can insert their own feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

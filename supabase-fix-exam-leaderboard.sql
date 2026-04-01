-- 1. Fix exam_submissions RLS to allow leaderboard visibility
-- This allows anyone to see COMPLETED submissions for the leaderboard
-- and allows admins to see everything.
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.exam_submissions;
DROP POLICY IF EXISTS "Users can view submissions" ON public.exam_submissions;

CREATE POLICY "Users can view submissions" ON public.exam_submissions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    status = 'completed' OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 2. Ensure the admin user has the 'admin' role in the profiles table
-- This is necessary for the admin policies to work.
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'fllimonm1212@gmail.com';

-- 3. Ensure profiles are viewable by everyone (needed for leaderboard names/avatars)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- 4. Ensure admins can manage all submissions (for Admin Panel)
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.exam_submissions;
CREATE POLICY "Admins can manage all submissions" ON public.exam_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

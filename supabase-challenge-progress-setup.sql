-- 1. Add participants column to challenges table
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS participants UUID[] DEFAULT '{}';

-- 2. Create user_challenge_progress table
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    progress_hours INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, challenge_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to prevent errors if run multiple times
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_challenge_progress;
DROP POLICY IF EXISTS "Admin can view all progress" ON public.user_challenge_progress;

-- 5. Create Policies for user_challenge_progress

-- Allow users to view their own progress
CREATE POLICY "Users can view their own progress"
ON public.user_challenge_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own progress (e.g., when they join a challenge)
CREATE POLICY "Users can insert their own progress"
ON public.user_challenge_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own progress
CREATE POLICY "Users can update their own progress"
ON public.user_challenge_progress
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admin to view all progress
CREATE POLICY "Admin can view all progress"
ON public.user_challenge_progress
FOR SELECT
USING (auth.jwt() ->> 'email' = 'fllimonm1212@gmail.com');

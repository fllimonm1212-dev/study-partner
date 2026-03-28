-- Run this script in your Supabase SQL Editor to create the challenges table

CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    target_hours INTEGER NOT NULL DEFAULT 0,
    reward_stars INTEGER NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read challenges
CREATE POLICY "Anyone can view challenges"
ON public.challenges FOR SELECT
USING (true);

-- Allow only the admin to insert, update, and delete challenges
-- Replace 'fllimonm1212@gmail.com' with your actual admin email if different
CREATE POLICY "Admin can insert challenges"
ON public.challenges FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'email' = 'fllimonm1212@gmail.com'
);

CREATE POLICY "Admin can update challenges"
ON public.challenges FOR UPDATE
USING (
  auth.jwt() ->> 'email' = 'fllimonm1212@gmail.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'fllimonm1212@gmail.com'
);

CREATE POLICY "Admin can delete challenges"
ON public.challenges FOR DELETE
USING (
  auth.jwt() ->> 'email' = 'fllimonm1212@gmail.com'
);

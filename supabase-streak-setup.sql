-- Add last_study_date to profiles table to track streaks
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- Ensure current_streak and total_stars have default values
ALTER TABLE public.profiles 
ALTER COLUMN current_streak SET DEFAULT 0,
ALTER COLUMN total_stars SET DEFAULT 0;

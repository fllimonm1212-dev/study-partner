-- Add daily_goal to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_goal INTEGER DEFAULT 240; -- Default 4 hours in minutes

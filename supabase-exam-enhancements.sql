-- Add started_at, completed_at and status to exam_submissions
ALTER TABLE public.exam_submissions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.exam_submissions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.exam_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Add explanation to exam_questions
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS explanation TEXT;

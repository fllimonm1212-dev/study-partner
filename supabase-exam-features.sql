-- Add new features to exams table
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS passing_percentage INTEGER DEFAULT 50;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS randomize_questions BOOLEAN DEFAULT false;

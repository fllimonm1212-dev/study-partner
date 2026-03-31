-- Create exams table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create exam_questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option_index INTEGER NOT NULL,
  points INTEGER DEFAULT 1,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create exam_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'in-progress',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exams
DROP POLICY IF EXISTS "Exams are viewable by everyone" ON public.exams;
CREATE POLICY "Exams are viewable by everyone" ON public.exams
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
CREATE POLICY "Admins can manage exams" ON public.exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for exam_questions
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.exam_questions;
CREATE POLICY "Questions are viewable by everyone" ON public.exam_questions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage questions" ON public.exam_questions;
CREATE POLICY "Admins can manage questions" ON public.exam_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for exam_submissions
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.exam_submissions;
CREATE POLICY "Users can view their own submissions" ON public.exam_submissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.exam_submissions;
CREATE POLICY "Users can insert their own submissions" ON public.exam_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own submissions" ON public.exam_submissions;
CREATE POLICY "Users can update their own submissions" ON public.exam_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- Add missing columns if tables already existed
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS explanation TEXT;

ALTER TABLE public.exam_submissions ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE public.exam_submissions ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE public.exam_submissions ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.exam_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in-progress';
ALTER TABLE public.exam_submissions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.exam_submissions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

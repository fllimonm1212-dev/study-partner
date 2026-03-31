-- Create group_requests table
CREATE TABLE IF NOT EXISTS public.group_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
DROP POLICY IF EXISTS "Users can view their own group requests" ON public.group_requests;
CREATE POLICY "Users can view their own group requests" ON public.group_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Group admins can view requests for their groups
DROP POLICY IF EXISTS "Group admins can view requests" ON public.group_requests;
CREATE POLICY "Group admins can view requests" ON public.group_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_requests.group_id AND user_id = auth.uid() AND role = 'admin')
  );

-- Users can create requests
DROP POLICY IF EXISTS "Users can create group requests" ON public.group_requests;
CREATE POLICY "Users can create group requests" ON public.group_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Group admins can update requests
DROP POLICY IF EXISTS "Group admins can update requests" ON public.group_requests;
CREATE POLICY "Group admins can update requests" ON public.group_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_requests.group_id AND user_id = auth.uid() AND role = 'admin')
  );

-- Enable realtime
alter publication supabase_realtime add table public.group_requests;

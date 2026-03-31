-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

-- Create group_messages table
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'pdf')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(sender_id, receiver_id)
);

-- Create personal_messages table
CREATE TABLE IF NOT EXISTS public.personal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'pdf')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
DROP POLICY IF EXISTS "Anyone can view approved groups" ON public.groups;
CREATE POLICY "Anyone can view approved groups" ON public.groups
  FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Users can view their own pending groups" ON public.groups;
CREATE POLICY "Users can view their own pending groups" ON public.groups
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admin can view all groups" ON public.groups;
CREATE POLICY "Admin can view all groups" ON public.groups
  FOR SELECT USING (
    (auth.jwt() ->> 'email') = 'fllimonm1212@gmail.com'
  );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admin can update groups" ON public.groups;
CREATE POLICY "Admin can update groups" ON public.groups
  FOR UPDATE USING (
    (auth.jwt() ->> 'email') = 'fllimonm1212@gmail.com'
  );

-- RLS Policies for group_members
DROP POLICY IF EXISTS "Anyone can view group members" ON public.group_members;
CREATE POLICY "Anyone can view group members" ON public.group_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join approved groups" ON public.group_members;
CREATE POLICY "Users can join approved groups" ON public.group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND (status = 'approved' OR created_by = auth.uid()))
  );

DROP POLICY IF EXISTS "Group creators are automatically admins" ON public.group_members;
CREATE POLICY "Group creators are automatically admins" ON public.group_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "Group admins can remove members" ON public.group_members;
CREATE POLICY "Group admins can remove members" ON public.group_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_members.group_id AND user_id = auth.uid() AND role = 'admin') OR
    (auth.jwt() ->> 'email') = 'fllimonm1212@gmail.com'
  );

-- RLS Policies for group_messages
DROP POLICY IF EXISTS "Group members can view messages" ON public.group_messages;
CREATE POLICY "Group members can view messages" ON public.group_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_messages.group_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Group members can insert messages" ON public.group_messages;
CREATE POLICY "Group members can insert messages" ON public.group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = public.group_messages.group_id AND user_id = auth.uid())
  );

-- RLS Policies for friend_requests
DROP POLICY IF EXISTS "Users can view their own friend requests" ON public.friend_requests;
CREATE POLICY "Users can view their own friend requests" ON public.friend_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
CREATE POLICY "Users can send friend requests" ON public.friend_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their own sent requests" ON public.friend_requests;
CREATE POLICY "Users can update their own sent requests" ON public.friend_requests
  FOR UPDATE USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can update received friend requests" ON public.friend_requests;
CREATE POLICY "Users can update received friend requests" ON public.friend_requests
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id AND status IN ('accepted', 'rejected'));

DROP POLICY IF EXISTS "Users can delete their own requests" ON public.friend_requests;
CREATE POLICY "Users can delete their own requests" ON public.friend_requests
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS Policies for personal_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.personal_messages;
CREATE POLICY "Users can view their own messages" ON public.personal_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages to friends" ON public.personal_messages;
CREATE POLICY "Users can send messages to friends" ON public.personal_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.friend_requests 
      WHERE status = 'accepted' AND 
      ((sender_id = auth.uid() AND receiver_id = public.personal_messages.receiver_id) OR 
       (receiver_id = auth.uid() AND sender_id = public.personal_messages.receiver_id))
    )
  );

-- Set up Realtime
alter publication supabase_realtime add table public.groups;
alter publication supabase_realtime add table public.group_members;
alter publication supabase_realtime add table public.group_messages;
alter publication supabase_realtime add table public.friend_requests;
alter publication supabase_realtime add table public.personal_messages;

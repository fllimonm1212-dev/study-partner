-- Create storage bucket for messages
INSERT INTO storage.buckets (id, name, public) 
VALUES ('messages', 'messages', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'messages' bucket
CREATE POLICY "Anyone can view message files"
ON storage.objects FOR SELECT
USING (bucket_id = 'messages');

CREATE POLICY "Authenticated users can upload message files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'messages' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own message files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'messages' AND 
  auth.uid() = owner
);

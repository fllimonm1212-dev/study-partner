-- Update profiles table with new social link columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS social_links_public BOOLEAN DEFAULT true;

-- Drop old columns if they exist (optional, but keeps it clean)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS github_url;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS linkedin_url;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS twitter_url;

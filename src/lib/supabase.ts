import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://uelwirsgbioeogqgeehx.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbHdpcnNnYmlvZW9ncWdlZWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MDgzMDUsImV4cCI6MjEwMDE4NDMwNX0.W2qtJsCmtwHCJdB95gWLcjqkdGOu1qHGB4OulKvSzXc';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (typeof envUrl === 'string' && envUrl.trim().length > 0) ? envUrl.trim() : defaultUrl;
const supabaseAnonKey = (typeof envKey === 'string' && envKey.trim().length > 0) ? envKey.trim() : defaultKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});


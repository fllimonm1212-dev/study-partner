import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uelwirsgbioeogqgeehx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbHdpcnNnYmlvZW9ncWdlZWh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MDgzMDUsImV4cCI6MjEwMDE4NDMwNX0.W2qtJsCmtwHCJdB95gWLcjqkdGOu1qHGB4OulKvSzXc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

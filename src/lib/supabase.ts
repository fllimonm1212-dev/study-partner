import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ufrzkfkboilpanvreulf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmcnprZmtib2lscGFudnJldWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjYyMTgsImV4cCI6MjA4OTA0MjIxOH0.0yULygYbHFjl9-vJ-2RvZYLzjYam5O0U8XRDoCvtxY4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

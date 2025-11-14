import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efndpccvawvjdufkjgzc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbmRwY2N2YXd2amR1ZmtqZ3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NTkzMzUsImV4cCI6MjA2MDEzNTMzNX0.IkllvJBgD9bBzKKbijSKolA0RcA4EbJen1hPreB4M28';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});


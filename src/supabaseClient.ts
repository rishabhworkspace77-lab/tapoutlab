// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// **IMPORTANT:** Replace these with your actual keys and use environment variables
// (e.g., process.env.REACT_APP_SUPABASE_URL) for production security.
const supabaseUrl = 'https://rzeuxsflzkvesbwxdroy.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6ZXV4c2Zsemt2ZXNid3hkcm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjEyMzksImV4cCI6MjA3OTI5NzIzOX0.D28tHA2WVe1PMsAstSJL-IcWLjQNz2qq6b8MZXUgWww';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
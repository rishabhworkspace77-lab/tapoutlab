// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// **IMPORTANT:** Replace these with your actual keys and use environment variables
// (e.g., process.env.REACT_APP_SUPABASE_URL) for production security.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);
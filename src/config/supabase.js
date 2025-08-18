// src/config/supabase.js

// IMPORTANT: Replace with your CURRENT Supabase Anon Key
const supabaseUrl = "https://hrlqnbzcjcmrpjwnoiby.supabase.co"; // Your Supabase URL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHFuYnpjamNtcnBqd25vaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTczODYsImV4cCI6MjA3MDk3MzM4Nn0.sOt8Gn2OpUn3dmwrBqzR2s9dzCn6GxqslhlU7iiE";

// This import is needed here because createClient is used in this file
import { createClient } from '@supabase/supabase-js';

let supabase = null;
// Check if window.supabase exists (meaning the CDN script has loaded)
if (typeof window !== 'undefined' && window.supabase) {
  supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Fallback for environments where window.supabase might not be available (e.g., during build, though Vercel should handle this)
  console.error("Supabase client not found on window. Attempting to create directly (might fail in some environments).");
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error("Failed to create Supabase client directly:", e);
  }
}

export { supabase };

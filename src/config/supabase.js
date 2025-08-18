// src/config/supabase.js

// IMPORTANT: Replace with your CURRENT Supabase Anon Key
const supabaseUrl = "https://hrlqnbzcjcmrpjwnoiby.supabase.co"; // Your Supabase URL
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHFuYnpjamNtcnBqd25vaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTczODYsImV4cCI6MjA3MDk3MzM4Nn0.sOt8Gn2OpUn3dmwrBqzR2s9dzCn6GxqslhlU7iiE";

// REMOVED: import { createClient } from '@supabase/supabase-js'; // No longer needed here

let supabase = null;
// Initialize Supabase client using the globally available window.supabase object
// This relies on the Supabase CDN script being loaded in public/index.html
if (typeof window !== 'undefined' && window.supabase) {
  supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
} else {
  // This fallback might still be hit in very specific build environments if window is not defined
  // but the primary build error should be resolved by relying on the CDN.
  console.error("Supabase client not found on window. Ensure CDN script is loaded in index.html.");
  // For environments where window is not defined (e.g., SSR), you'd need a different approach.
}

export { supabase };

import { createClient } from '@supabase/supabase-js';

// Configuration constants should be in a single place, like here or in environment variables.
const SUPABASE_URL = "https://hrlqnbzcjcmrpjwnoiby.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhybHFuYnpjamNtcnBqd25vaWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzOTczODYsImV4cCI6MjA3MDk3MzM4Nn0.sOt8Gn2OpUn4dmwrBqzR2s9dzCn6GxqslRgZhlU7iiE";

// Initialize the Supabase client once and export it for use in other services.
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Signs in a user with their email and password.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<{ data: any, error: any }>} The result of the sign-in operation.
 */
export const signInUser = (email, password) => {
  return supabaseClient.auth.signInWithPassword({ email, password });
};

/**
 * Signs up a new user.
 * @param {object} signUpData - The user's sign-up information (email, password, fullName, username).
 * @returns {Promise<{ data: any, error: any }>} The result of the sign-up operation.
 */
export const signUpUser = ({ email, password, fullName, username }) => {
  const generatedUsername = username || `user_${Math.random().toString(36).substring(2, 9)}`;
  return supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username: generatedUsername,
      },
    },
  });
};

/**
 * Signs out the currently logged-in user.
 * @returns {Promise<{ error: any }>} The result of the sign-out operation.
 */
export const signOutUser = () => {
  return supabaseClient.auth.signOut();
};

/**
 * Subscribes to authentication state changes.
 * @param {function} callback - The function to call when the auth state changes.
 * @returns {object} The subscription object, which can be used to unsubscribe.
 */
export const onAuthStateChange = (callback) => {
  return supabaseClient.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
};

/**
 * Updates the user's password.
 * @param {string} newPassword - The new password for the user.
 * @returns {Promise<{ data: any, error: any }>} The result of the update operation.
 */
export const updateUserPassword = (newPassword) => {
    return supabaseClient.auth.updateUser({ password: newPassword });
};

/**
 * Updates the user's email address.
 * @param {string} newEmail - The new email for the user.
 * @returns {Promise<{ data: any, error: any }>} The result of the update operation.
 */
export const updateUserEmail = (newEmail) => {
    return supabaseClient.auth.updateUser({ email: newEmail });
};

/**
 * Gets the current user's session.
 * @returns {Promise<{ data: { session: any }, error: any }>} The current session.
 */
export const getSession = () => {
    return supabaseClient.auth.getSession();
};

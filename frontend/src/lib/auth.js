import { supabase } from "./supabase";

// Login
export const signIn = async (email, password) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

// Register
export const signUp = async (email, password) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

// Logout
export const signOut = async () => {
  return await supabase.auth.signOut();
};

// Get current user
export const getUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user;
};

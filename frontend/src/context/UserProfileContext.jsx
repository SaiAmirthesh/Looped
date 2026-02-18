import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const UserProfileContext = createContext(null);

export function UserProfileProvider({ children }) {
  const [profile, setProfile] = useState(null); // { avatar_url, display_name, level, current_xp, next_level_xp, total_xp }
  const [user, setUser] = useState(null);

  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('avatar_url, display_name, level, current_xp, next_level_xp, total_xp')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Call this after a successful avatar upload to update context immediately
  const updateAvatarUrl = useCallback((url) => {
    setProfile(prev => prev ? { ...prev, avatar_url: url } : { avatar_url: url });
  }, []);

  return (
    <UserProfileContext.Provider value={{ user, profile, fetchProfile, updateAvatarUrl }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}

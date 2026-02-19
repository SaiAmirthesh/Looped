import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const UserProfileContext = createContext(null);

const nextLevelXp = (level) => Math.floor(100 * Math.pow(level ?? 1, 1.5));

export function UserProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);

  const fetchProfile = useCallback(async (userId, authUser = null) => {
    // First try to get existing profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('avatar_url, display_name, level, current_xp, total_xp')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setProfile({ ...data, next_level_xp: nextLevelXp(data.level) });
      return;
    }

    // No profile row yet (e.g. first Google OAuth login) — create one
    const googleName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || null;
    const googleAvatar = authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || null;
    const { data: newProfile } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: authUser?.email ?? null,
        display_name: googleName,
        avatar_url: googleAvatar,
        level: 1,
        current_xp: 0,
        total_xp: 0,
        next_level_xp: 100,
      }, { onConflict: 'id' })
      .select('avatar_url, display_name, level, current_xp, total_xp')
      .single();

    if (newProfile) setProfile({ ...newProfile, next_level_xp: nextLevelXp(newProfile.level) });
  }, []);


  useEffect(() => {
    let currentUserId = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        currentUserId = session.user.id;
        setUser(session.user);
        fetchProfile(session.user.id, session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        // Only refetch profile if the user actually changed
        if (session.user.id !== currentUserId) {
          currentUserId = session.user.id;
          fetchProfile(session.user.id, session.user);
        }
      } else {
        currentUserId = null;
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateAvatarUrl = useCallback((url) => {
    setProfile(prev => prev ? { ...prev, avatar_url: url } : { avatar_url: url });
  }, []);

  // Call this after any XP-awarding action to refresh the XP bar
  const refreshProfile = useCallback((userId) => {
    if (userId) fetchProfile(userId);
  }, [fetchProfile]);

  // Instantly update profile XP in state (no DB round-trip) — avoids timing race
  const applyXpToProfile = useCallback((xpDelta) => {
    setProfile(prev => {
      if (!prev) return prev;
      let { current_xp, level, total_xp } = prev;
      let newCurrentXp = (current_xp ?? 0) + xpDelta;
      let newLevel = level ?? 1;
      const newTotalXp = Math.max(0, (total_xp ?? 0) + xpDelta);
      const calcThreshold = (lvl) => Math.floor(100 * Math.pow(lvl, 1.5));
      if (xpDelta > 0) {
        let t = calcThreshold(newLevel);
        while (newCurrentXp >= t) { newCurrentXp -= t; newLevel++; t = calcThreshold(newLevel); }
      } else {
        while (newCurrentXp < 0 && newLevel > 1) { newLevel--; newCurrentXp += calcThreshold(newLevel); }
        newCurrentXp = Math.max(0, newCurrentXp);
      }
      return { ...prev, current_xp: newCurrentXp, level: newLevel, total_xp: newTotalXp, next_level_xp: calcThreshold(newLevel) };
    });
  }, []);

  const updateDisplayName = useCallback(async (newDisplayName) => {
    if (!user) return { error: 'No user logged in' };
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ display_name: newDisplayName })
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, display_name: newDisplayName } : { display_name: newDisplayName });
    }
    return { error };
  }, [user]);

  return (
    <UserProfileContext.Provider value={{ 
      user, 
      profile, 
      fetchProfile, 
      updateAvatarUrl, 
      refreshProfile, 
      applyXpToProfile,
      updateDisplayName 
    }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}

export default UserProfileProvider;

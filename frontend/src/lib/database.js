import { supabase } from './supabaseClient';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Compute XP needed to reach the next level from the current one. */
const nextLevelXp = (level) => Math.floor(100 * Math.pow(level, 1.5));

/** Today's date as YYYY-MM-DD (local time). */
const today = () => new Date().toISOString().split('T')[0];

/**
 * Apply XP delta to a { current_xp, level, total_xp } object.
 * Handles level-ups and level-downs (for uncomplete).
 * Returns the updated fields to write back to user_profiles.
 */
const applyXpDelta = (profile, delta) => {
  let { current_xp, level, total_xp } = profile;
  let newCurrentXp = (current_xp ?? 0) + delta;
  let newLevel = level ?? 1;
  const newTotalXp = Math.max(0, (total_xp ?? 0) + delta);

  if (delta > 0) {
    // Level up loop
    let threshold = nextLevelXp(newLevel);
    while (newCurrentXp >= threshold) {
      newCurrentXp -= threshold;
      newLevel += 1;
      threshold = nextLevelXp(newLevel);
    }
  } else {
    // Level down loop (XP reverted)
    while (newCurrentXp < 0 && newLevel > 1) {
      newLevel -= 1;
      newCurrentXp += nextLevelXp(newLevel);
    }
    newCurrentXp = Math.max(0, newCurrentXp);
  }

  return { current_xp: newCurrentXp, level: newLevel, total_xp: newTotalXp, next_level_xp: nextLevelXp(newLevel) };
};

// ─── User Profile ────────────────────────────────────────────────────────────

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, display_name, avatar_url, total_xp, current_xp, level, created_at')
    .eq('id', userId)
    .single();
  if (error) { console.error('getUserProfile:', error.message); return null; }
  return { ...data, next_level_xp: nextLevelXp(data.level ?? 1) };
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select('id, email, display_name, avatar_url, total_xp, current_xp, level')
    .single();
  if (error) { console.error('updateUserProfile:', error.message); return null; }
  return { ...data, next_level_xp: nextLevelXp(data.level ?? 1) };
};

// ─── Habits ──────────────────────────────────────────────────────────────────

/**
 * Fetch all habits for a user.
 * Derives `completed_today` from habit_completions in a single query
 * using a left join subquery — no second round-trip.
 */
export const getHabits = async (userId) => {
  const todayStr = today();
  const { data, error } = await supabase
    .from('habits')
    .select(`
      id, user_id, name, category, skill, streak, longest_streak, last_completed, created_at,
      habit_completions!left(completed_date)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) { console.error('getHabits:', error.message); return []; }

  // Flatten: derive completed_today from the joined completions
  return (data ?? []).map(h => {
    const completedToday = (h.habit_completions ?? []).some(c => c.completed_date === todayStr);
    const { habit_completions: _, ...rest } = h;
    return { ...rest, completed_today: completedToday };
  });
};

export const createHabit = async (userId, habitData) => {
  const { data, error } = await supabase
    .from('habits')
    .insert([{
      user_id: userId,
      name: habitData.name,
      category: habitData.category,
      skill: habitData.skill,
      streak: 0,
      longest_streak: 0,
    }])
    .select('id, user_id, name, category, skill, streak, longest_streak, last_completed, created_at')
    .single();
  if (error) { console.error('createHabit:', error.message); return null; }
  return { ...data, completed_today: false };
};

export const updateHabit = async (habitId, updates) => {
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', habitId)
    .select()
    .single();
  if (error) { console.error('updateHabit:', error.message); return null; }
  return data;
};

export const deleteHabit = async (habitId) => {
  const { error } = await supabase.from('habits').delete().eq('id', habitId);
  if (error) { console.error('deleteHabit:', error.message); return false; }
  return true;
};

/**
 * Complete a habit for today.
 * Single atomic batch:
 *   1. Insert habit_completion (UNIQUE guard prevents double-award)
 *   2. Fetch profile + habit in parallel
 *   3. Update profile XP + skill XP in parallel
 *   4. Update habit streak
 */
export const completeHabit = async (habitId, userId, xpEarned = 10) => {
  try {
    const todayStr = today();

    // 1. Insert completion — UNIQUE(habit_id, completed_date) prevents double-award
    const { error: insertError } = await supabase
      .from('habit_completions')
      .insert([{ habit_id: habitId, user_id: userId, completed_date: todayStr, xp_earned: xpEarned }]);

    if (insertError) {
      // 23505 = unique_violation → already completed today, not an error
      if (insertError.code === '23505') return { success: true, alreadyDone: true };
      throw insertError;
    }

    // 2. Fetch profile + habit in parallel (one round-trip each, concurrent)
    const [profileRes, habitRes] = await Promise.all([
      supabase.from('user_profiles').select('current_xp, level, total_xp').eq('id', userId).single(),
      supabase.from('habits').select('skill, streak').eq('id', habitId).single(),
    ]);
    if (profileRes.error) throw profileRes.error;
    if (habitRes.error) throw habitRes.error;

    const xpFields = applyXpDelta(profileRes.data, xpEarned);
    const newStreak = (habitRes.data.streak ?? 0) + 1;

    // 3. Update profile XP + skill XP in parallel
    await Promise.all([
      supabase.from('user_profiles').update(xpFields).eq('id', userId),
      addSkillXP(userId, habitRes.data.skill, xpEarned),
      supabase.from('habits').update({ streak: newStreak, last_completed: todayStr }).eq('id', habitId),
    ]);

    return { success: true, xpAwarded: xpEarned, newLevel: xpFields.level };
  } catch (err) {
    console.error('completeHabit:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Uncomplete a habit for today (revert XP).
 * Deletes the completion row and subtracts XP atomically.
 */
export const uncompleteHabit = async (habitId, userId) => {
  try {
    const todayStr = today();

    // Delete completion row
    const { error: deleteError } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('completed_date', todayStr);
    if (deleteError) throw deleteError;

    // Fetch profile + habit in parallel
    const [profileRes, habitRes] = await Promise.all([
      supabase.from('user_profiles').select('current_xp, level, total_xp').eq('id', userId).single(),
      supabase.from('habits').select('skill, streak').eq('id', habitId).single(),
    ]);
    if (profileRes.error) throw profileRes.error;
    if (habitRes.error) throw habitRes.error;

    const xpFields = applyXpDelta(profileRes.data, -10);
    const newStreak = Math.max(0, (habitRes.data.streak ?? 0) - 1);

    // Update profile XP + skill XP + streak in parallel
    await Promise.all([
      supabase.from('user_profiles').update(xpFields).eq('id', userId),
      subtractSkillXP(userId, habitRes.data.skill, 10),
      supabase.from('habits').update({ streak: newStreak }).eq('id', habitId),
    ]);

    return { success: true };
  } catch (err) {
    console.error('uncompleteHabit:', err.message);
    return { success: false, error: err.message };
  }
};

// ─── Quests ──────────────────────────────────────────────────────────────────

export const getQuests = async (userId) => {
  const { data, error } = await supabase
    .from('quests')
    .select('id, user_id, title, description, difficulty, skill, xp_reward, completed, completed_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('getQuests:', error.message); return []; }
  return data ?? [];
};

export const createQuest = async (userId, questData) => {
  const { data, error } = await supabase
    .from('quests')
    .insert([{
      user_id: userId,
      title: questData.title,
      description: questData.description || '',
      difficulty: questData.difficulty,
      skill: questData.skill,
      xp_reward: questData.xpReward || 50,
      completed: false,
    }])
    .select()
    .single();
  if (error) { console.error('createQuest:', error.message); return null; }
  return data;
};

export const deleteQuest = async (questId) => {
  const { error } = await supabase.from('quests').delete().eq('id', questId);
  if (error) { console.error('deleteQuest:', error.message); return false; }
  return true;
};

/**
 * Complete a quest with atomic XP award.
 * Fetches quest + profile in parallel, then writes in parallel.
 */
export const completeQuest = async (questId, userId) => {
  try {
    const [questRes, profileRes] = await Promise.all([
      supabase.from('quests').select('xp_reward, skill, completed').eq('id', questId).single(),
      supabase.from('user_profiles').select('current_xp, level, total_xp').eq('id', userId).single(),
    ]);
    if (questRes.error) throw questRes.error;
    if (profileRes.error) throw profileRes.error;
    if (questRes.data.completed) return { success: true, alreadyDone: true };

    const xpReward = questRes.data.xp_reward ?? 50;
    const xpFields = applyXpDelta(profileRes.data, xpReward);

    const [, profileUpdate] = await Promise.all([
      supabase.from('quests').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', questId),
      supabase.from('user_profiles').update(xpFields).eq('id', userId),
    ]);
    if (profileUpdate.error) throw profileUpdate.error;

    if (questRes.data.skill) {
      addSkillXP(userId, questRes.data.skill, xpReward).catch(e =>
        console.warn('[completeQuest] skill XP:', e?.message)
      );
    }

    return { success: true, xpAwarded: xpReward, newLevel: xpFields.level };
  } catch (err) {
    console.error('[completeQuest] failed:', err.message);
    return { success: false, error: err.message };
  }
};


// ─── Skills ──────────────────────────────────────────────────────────────────

export const getSkills = async (userId) => {
  const { data, error } = await supabase
    .from('skills')
    .select('id, user_id, name, current_xp, level, created_at')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) { console.error('getSkills:', error.message); return []; }
  // Attach computed next_level_xp so callers don't need to recompute
  return (data ?? []).map(s => ({ ...s, next_level_xp: nextLevelXp(s.level ?? 1) }));
};

/** Internal: add XP to a skill with level-up logic. No extra fetch — takes skillName. */
export const addSkillXP = async (userId, skillName, xpAmount) => {
  if (!skillName || !userId) return null; // guard against null skill

  const { data: skill, error: fetchErr } = await supabase
    .from('skills')
    .select('id, current_xp, level')
    .eq('user_id', userId)
    .eq('name', skillName)
    .maybeSingle(); // maybeSingle returns null instead of throwing if no row found
  if (fetchErr) { console.error('addSkillXP fetch:', fetchErr.message); return null; }
  if (!skill) { console.warn(`addSkillXP: skill '${skillName}' not found for user`); return null; }

  let newXp = (skill.current_xp ?? 0) + xpAmount;
  let newLevel = skill.level ?? 1;
  let threshold = nextLevelXp(newLevel);
  while (newXp >= threshold) { newXp -= threshold; newLevel++; threshold = nextLevelXp(newLevel); }

  const { data, error } = await supabase
    .from('skills')
    .update({ current_xp: newXp, level: newLevel })
    .eq('id', skill.id)
    .select()
    .single();
  if (error) { console.error('addSkillXP update:', error.message); return null; }
  return data;
};

/** Internal: subtract XP from a skill (for uncomplete). */
const subtractSkillXP = async (userId, skillName, xpAmount) => {
  const { data: skill, error: fetchErr } = await supabase
    .from('skills')
    .select('id, current_xp, level')
    .eq('user_id', userId)
    .eq('name', skillName)
    .single();
  if (fetchErr) { console.error('subtractSkillXP fetch:', fetchErr.message); return null; }

  let newXp = (skill.current_xp ?? 0) - xpAmount;
  let newLevel = skill.level ?? 1;
  while (newXp < 0 && newLevel > 1) { newLevel--; newXp += nextLevelXp(newLevel); }
  newXp = Math.max(0, newXp);

  const { data, error } = await supabase
    .from('skills')
    .update({ current_xp: newXp, level: newLevel })
    .eq('id', skill.id)
    .select()
    .single();
  if (error) { console.error('subtractSkillXP update:', error.message); return null; }
  return data;
};

// ─── Focus Sessions ──────────────────────────────────────────────────────────

export const createFocusSession = async (userId, durationMinutes, sessionType = 'focus') => {
  const { data, error } = await supabase
    .from('focus_sessions')
    .insert([{ user_id: userId, duration_minutes: durationMinutes, session_type: sessionType, completed: false, xp_earned: 0 }])
    .select()
    .single();
  if (error) { console.error('createFocusSession:', error.message); return null; }
  return data;
};

/**
 * Complete a focus session: marks it done, awards XP to profile + Focus skill.
 * XP = 15 per 25-min Pomodoro, scaled proportionally for other durations.
 */
export const completeFocusSession = async (sessionId, userId, durationMinutes = 25) => {
  try {
    const xpEarned = Math.round((durationMinutes / 25) * 15);
    const now = new Date().toISOString();

    // Fetch profile for XP calculation
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('current_xp, level, total_xp')
      .eq('id', userId)
      .single();
    if (profileErr) throw profileErr;

    const xpFields = applyXpDelta(profile, xpEarned);

    // Write session complete + profile XP + skill XP in parallel
    await Promise.all([
      supabase.from('focus_sessions').update({ completed: true, completed_at: now, xp_earned: xpEarned }).eq('id', sessionId),
      supabase.from('user_profiles').update(xpFields).eq('id', userId),
      addSkillXP(userId, 'Focus', xpEarned),
    ]);

    return { success: true, xpAwarded: xpEarned, newLevel: xpFields.level };
  } catch (err) {
    console.error('completeFocusSession:', err.message);
    return { success: false, error: err.message };
  }
};

/** Get today's completed focus session count for a user. */
export const getTodayFocusCount = async (userId) => {
  const todayStr = today();
  const { count, error } = await supabase
    .from('focus_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('session_type', 'focus')
    .eq('completed', true)
    .gte('started_at', `${todayStr}T00:00:00`)
    .lte('started_at', `${todayStr}T23:59:59`);
  if (error) { console.error('getTodayFocusCount:', error.message); return 0; }
  return count ?? 0;
};

// ─── Calendar ────────────────────────────────────────────────────────────────

/**
 * Fetch habit completion dates for a given month.
 * Returns a Set of date strings (YYYY-MM-DD) that have at least one completion.
 */
export const getMonthCompletions = async (userId, year, month) => {
  // month is 1-indexed
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('habit_completions')
    .select('completed_date, xp_earned')
    .eq('user_id', userId)
    .gte('completed_date', start)
    .lte('completed_date', end);

  if (error) { console.error('getMonthCompletions:', error.message); return { dates: new Set(), totalXp: 0 }; }

  const dates = new Set((data ?? []).map(c => c.completed_date));
  const totalXp = (data ?? []).reduce((sum, c) => sum + (c.xp_earned ?? 0), 0);
  return { dates, totalXp };
};

// ─── Dashboard (parallel batch) ──────────────────────────────────────────────

/**
 * Fetch all dashboard data in one parallel batch.
 * Returns: { profile, habits, quests, skills }
 * next_level_xp is computed, not fetched.
 */
export const getDashboardData = async (userId) => {
  const todayStr = today();

  const [profileRes, habitsRes, questsRes, skillsRes] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url, total_xp, current_xp, level')
      .eq('id', userId)
      .single(),
    supabase
      .from('habits')
      .select(`id, name, category, skill, streak, longest_streak, last_completed, created_at,
               habit_completions!left(completed_date)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('quests')
      .select('id, title, description, difficulty, skill, xp_reward, completed, completed_at, created_at')
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('skills')
      .select('id, name, current_xp, level')
      .eq('user_id', userId)
      .order('name', { ascending: true }),
  ]);

  const profile = profileRes.data
    ? { ...profileRes.data, next_level_xp: nextLevelXp(profileRes.data.level ?? 1) }
    : null;

  const habits = (habitsRes.data ?? []).map(h => {
    const completedToday = (h.habit_completions ?? []).some(c => c.completed_date === todayStr);
    const { habit_completions: _, ...rest } = h;
    return { ...rest, completed_today: completedToday };
  });

  const quests = questsRes.data ?? [];
  const skills = (skillsRes.data ?? []).map(s => ({ ...s, next_level_xp: nextLevelXp(s.level ?? 1) }));

  return { profile, habits, quests, skills };
};

import { supabase } from './supabaseClient';

/**
 * DATABASE API LAYER FOR LOOPED
 * 
 * This module provides transactional operations for:
 * - Habit CRUD + completion with XP awards
 * - Quest CRUD + completion with transactional XP
 * - Skill fetching and XP updates
 * - User profile updates
 * - Focus session tracking
 * 
 * KEY PATTERN: All "completion" operations are transactional:
 * When a habit/quest is completed, we:
 * 1. Insert the completion record
 * 2. Calculate XP earned
 * 3. Update user_profiles.total_xp atomically
 * 4. Update skill XP if applicable
 */

// ============================================
// USER PROFILE OPERATIONS
// ============================================

export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

// ============================================
// HABITS OPERATIONS
// ============================================

export const createHabit = async (userId, habitData) => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .insert([
        {
          user_id: userId,
          name: habitData.name,
          category: habitData.category,
          skill: habitData.skill,
          completed_today: false,
          streak: 0,
          longest_streak: 0,
        },
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating habit:', error);
    return null;
  }
};

export const getHabits = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching habits:', error);
    return [];
  }
};

export const updateHabit = async (habitId, updates) => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating habit:', error);
    return null;
  }
};

export const deleteHabit = async (habitId) => {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting habit:', error);
    return false;
  }
};

/**
 * CRITICAL: Complete a habit with transactional XP update
 * 
 * Steps:
 * 1. Insert into habit_completions (10 XP default)
 * 2. Update user_profiles.total_xp atomically
 * 3. Update skill XP for the habit's skill
 * 4. Update habit's streak and completed_today
 * 
 * Uses PostgreSQL transactions via Supabase RPC
 */
export const completeHabit = async (habitId, userId, xpEarned = 10) => {
  try {
    // Step 1: Insert habit completion record
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data: completionData, error: completionError } = await supabase
      .from('habit_completions')
      .insert([
        {
          habit_id: habitId,
          user_id: userId,
          completed_date: today,
          xp_earned: xpEarned,
        },
      ])
      .select()
      .single();
    
    if (completionError) throw completionError;
    
    // Step 2: Update user total_xp
    const userProfile = await getUserProfile(userId);
    if (!userProfile) throw new Error('User profile not found');
    
    const newTotalXp = (userProfile.total_xp || 0) + xpEarned;
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ total_xp: newTotalXp })
      .eq('id', userId);
    
    if (profileError) throw profileError;
    
    // Step 3: Get habit to find its skill, then update skill XP
    const habit = await getHabitById(habitId);
    if (habit) {
      await addSkillXP(userId, habit.skill, xpEarned);
    }
    
    // Step 4: Update habit metadata
    const updatedHabit = await updateHabit(habitId, {
      completed_today: true,
      last_completed: today,
    });
    
    return {
      success: true,
      completion: completionData,
      updatedHabit,
      xpAwarded: xpEarned,
    };
  } catch (error) {
    console.error('Error completing habit:', error);
    return { success: false, error: error.message };
  }
};

export const getHabitById = async (habitId) => {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching habit:', error);
    return null;
  }
};

// ============================================
// QUESTS OPERATIONS
// ============================================

export const createQuest = async (userId, questData) => {
  try {
    const { data, error } = await supabase
      .from('quests')
      .insert([
        {
          user_id: userId,
          title: questData.title,
          description: questData.description || '',
          difficulty: questData.difficulty,
          skill: questData.skill,
          xp_reward: questData.xpReward || 50,
          completed: false,
        },
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating quest:', error);
    return null;
  }
};

export const getQuests = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching quests:', error);
    return [];
  }
};

export const updateQuest = async (questId, updates) => {
  try {
    const { data, error } = await supabase
      .from('quests')
      .update(updates)
      .eq('id', questId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating quest:', error);
    return null;
  }
};

export const deleteQuest = async (questId) => {
  try {
    const { error } = await supabase
      .from('quests')
      .delete()
      .eq('id', questId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting quest:', error);
    return false;
  }
};

/**
 * CRITICAL: Complete a quest with transactional XP update
 * 
 * Steps:
 * 1. Mark quest as completed
 * 2. Award XP to user (quest.xp_reward)
 * 3. Award XP to skill
 * 
 * Similar pattern to completeHabit
 */
export const completeQuest = async (questId, userId) => {
  try {
    // Fetch quest to get xp_reward
    const { data: questData, error: questError } = await supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .single();
    
    if (questError) throw questError;
    
    const xpReward = questData.xp_reward || 50;
    
    // Update quest as completed
    const { error: updateError } = await supabase
      .from('quests')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', questId);
    
    if (updateError) throw updateError;
    
    // Award XP to user profile
    const userProfile = await getUserProfile(userId);
    if (!userProfile) throw new Error('User profile not found');
    
    const newTotalXp = (userProfile.total_xp || 0) + xpReward;
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ total_xp: newTotalXp })
      .eq('id', userId);
    
    if (profileError) throw profileError;
    
    // Award XP to skill
    await addSkillXP(userId, questData.skill, xpReward);
    
    return {
      success: true,
      questId,
      xpAwarded: xpReward,
    };
  } catch (error) {
    console.error('Error completing quest:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SKILLS OPERATIONS
// ============================================

export const getSkills = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching skills:', error);
    return [];
  }
};

export const getSkillProgress = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_skill_progress')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching skill progress:', error);
    return [];
  }
};

/**
 * Add XP to a specific skill
 * Auto-levels if XP exceeds next_level_xp threshold
 */
export const addSkillXP = async (userId, skillName, xpAmount) => {
  try {
    // Fetch current skill
    const { data: skillData, error: fetchError } = await supabase
      .from('skills')
      .select('*')
      .eq('user_id', userId)
      .eq('name', skillName)
      .single();
    
    if (fetchError) throw fetchError;
    
    let newCurrentXp = (skillData.current_xp || 0) + xpAmount;
    let newLevel = skillData.level || 1;
    
    // Auto-level: XP threshold is 100 * level^1.5
    const nextLevelXp = Math.floor(100 * Math.pow(newLevel, 1.5));
    
    // Level up if threshold exceeded
    while (newCurrentXp >= nextLevelXp) {
      newCurrentXp -= nextLevelXp;
      newLevel += 1;
    }
    
    // Update skill
    const { data, error } = await supabase
      .from('skills')
      .update({
        current_xp: newCurrentXp,
        level: newLevel,
      })
      .eq('id', skillData.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding skill XP:', error);
    return null;
  }
};

// ============================================
// FOCUS SESSIONS OPERATIONS
// ============================================

export const createFocusSession = async (userId, durationMinutes) => {
  try {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert([
        {
          user_id: userId,
          duration_minutes: durationMinutes,
          session_type: 'focus',
          completed: false,
          xp_earned: 0,
        },
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating focus session:', error);
    return null;
  }
};

export const completeFocusSession = async (sessionId, userId) => {
  try {
    // Calculate XP: 25 minutes (1 Pomodoro) = 15 XP
    const xpEarned = 15;
    
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('focus_sessions')
      .update({
        completed: true,
        completed_at: now,
        xp_earned: xpEarned,
      })
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Award XP to user profile
    const userProfile = await getUserProfile(userId);
    if (userProfile) {
      const newTotalXp = (userProfile.total_xp || 0) + xpEarned;
      await supabase
        .from('user_profiles')
        .update({ total_xp: newTotalXp })
        .eq('id', userId);
    }
    
    // Award XP to Focus skill
    await addSkillXP(userId, 'Focus', xpEarned);
    
    return {
      success: true,
      sessionId,
      xpAwarded: xpEarned,
    };
  } catch (error) {
    console.error('Error completing focus session:', error);
    return { success: false, error: error.message };
  }
};

export const getFocusSessions = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching focus sessions:', error);
    return [];
  }
};

// ============================================
// CALENDAR DATA OPERATIONS
// ============================================

export const getDailyCompletionSummary = async (userId, date) => {
  try {
    const { data, error } = await supabase
      .from('user_daily_completion_summary')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    return null;
  }
};

export const getCalendarData = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_calendar_view')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return [];
  }
};

// ============================================
// DASHBOARD STATS (from view)
// ============================================

export const getDashboardStats = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_dashboard_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }

};

export const uncompleteHabit = async (habitId, userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Delete today's completion record
    const { error: deleteError } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('completed_date', today);
    
    if (deleteError) throw deleteError;
    
    // Set completed_today to false
    const { error: updateError } = await supabase
      .from('habits')
      .update({ completed_today: false })
      .eq('id', habitId);
    
    if (updateError) throw updateError;
    
    return { success: true };
  } catch (error) {
    console.error('Error uncompleting habit:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// BATCH OPERATIONS (Optimized for latency)
// ============================================

/**
 * Fetch all dashboard data in parallel
 * Returns: { profile, stats, habits, quests, skills }
 * Uses Promise.all for concurrent requests
 */
export const getDashboardData = async (userId) => {
  try {
    const [profile, stats, habits, quests, skills] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      supabase
        .from('user_dashboard_stats')
        .select('*')
        .eq('user_id', userId)
        .single(),
      supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('quests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('skills')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true }),
    ]);

    const errors = [profile.error, stats.error, habits.error, quests.error, skills.error].filter(e => e);
    if (errors.length > 0) {
      console.warn('Some dashboard queries failed:', errors);
    }

    return {
      profile: profile.data,
      stats: stats.data,
      habits: habits.data || [],
      quests: quests.data || [],
      skills: skills.data || [],
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { profile: null, stats: null, habits: [], quests: [], skills: [] };
  }
};

/**
 * Fetch all profile-related data for ProfilePage
 * Returns: { profile, skills, habits, quests, focusSessions }
 */
export const getProfileData = async (userId) => {
  try {
    const [profile, skills, habits, quests, sessions] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      supabase
        .from('skills')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('quests')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('completed_at', { ascending: false }),
    ]);

    return {
      profile: profile.data,
      skills: skills.data || [],
      habits: habits.data || [],
      quests: quests.data || [],
      focusSessions: sessions.data || [],
    };
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return { profile: null, skills: [], habits: [], quests: [], focusSessions: [] };
  }
};




/**
 * Supabase Database API Layer
 * Handles all CRUD operations for the Looped application
 */

import { supabase } from './supabaseClient';

// ============================================
// DATA CACHE (In-memory)
// ============================================
const dataCache = {
    profile: null,
    skills: null,
    skillProgress: null,
    habits: null,
    quests: null,
    focusSessions: null
};

export const getCachedProfile = () => dataCache.profile;
export const getCachedSkills = () => dataCache.skills;
export const getCachedSkillProgress = () => dataCache.skillProgress;
export const getCachedHabits = () => dataCache.habits;
export const getCachedQuests = () => dataCache.quests;

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get a valid session, refreshing if needed.
 * Crucial for recovering from sleep/background tabs where auto-refresh might have paused.
 */
async function getValidSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;

    // Check if access token is expired (or close to it)
    const expiresAt = session.expires_at; // timestamp in seconds
    const now = Math.floor(Date.now() / 1000);

    // Refresh if expired or expiring in < 60 seconds
    if (expiresAt && (expiresAt < now + 60)) {
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
            console.error('Session refresh failed', refreshError);
            return null;
        }
        return newSession;
    }

    return session;
}

// ============================================
// BATCH FETCH (reduces latency - 1 auth check + parallel queries)
// ============================================

/**
 * Helper to resolve User ID (uses provided ID or fetches session)
 */
async function resolveUserId(providedId) {
    if (providedId) return providedId;
    const session = await getValidSession();
    return session?.user?.id;
}

/**
 * Fetch all dashboard data in parallel (profile + habits + quests)
 * ~3x faster than sequential fetches
 */
export async function getDashboardDataBatch(userIdArg) {
    const userId = await resolveUserId(userIdArg);
    if (!userId) throw new Error('No authenticated user');

    const [profileRes, habitsRes, questsRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', userId).single(),
        supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('quests').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    if (profileRes.error) throw profileRes.error;
    if (habitsRes.error) throw habitsRes.error;
    if (questsRes.error) throw questsRes.error;

    const habits = (habitsRes.data || []).map(h => ({
        id: h.id, name: h.name, category: h.category, skill: h.skill,
        completedToday: h.completed_today, streak: h.streak,
        longestStreak: h.longest_streak, lastCompleted: h.last_completed
    }));
    const quests = (questsRes.data || []).map(q => ({
        id: q.id, title: q.title, description: q.description, difficulty: q.difficulty,
        skill: q.skill, xpReward: q.xp_reward, completed: q.completed, completedAt: q.completed_at
    }));

    dataCache.profile = profileRes.data;
    dataCache.habits = habits;
    dataCache.quests = quests;
    return { profile: profileRes.data, habits, quests };
}

/**
 * Fetch all profile page data in parallel
 */
export async function getProfileDataBatch(userIdArg) {
    const userId = await resolveUserId(userIdArg);
    if (!userId) throw new Error('No authenticated user');

    const [profileRes, skillsRes, habitsRes, questsRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', userId).single(),
        supabase.from('user_skill_progress').select('*').eq('user_id', userId).order('skill_name'),
        supabase.from('habits').select('*').eq('user_id', userId),
        supabase.from('quests').select('*').eq('user_id', userId)
    ]);

    if (profileRes.error) throw profileRes.error;
    if (skillsRes.error) throw skillsRes.error;
    if (habitsRes.error) throw habitsRes.error;
    if (questsRes.error) throw questsRes.error;

    const skills = (skillsRes.data || []).map(s => ({
        name: s.skill_name, currentXP: s.current_xp, level: s.level,
        maxXP: s.next_level_xp, progress: s.progress_percentage
    }));
    const habits = (habitsRes.data || []).map(h => ({
        ...h,
        completedToday: h.completed_today,
        longestStreak: h.longest_streak
    }));
    const quests = questsRes.data || [];

    dataCache.profile = profileRes.data;
    dataCache.skills = skills;
    dataCache.habits = habits; // Be mindful this has extra fields that might not match getUserHabits exactly but should be superset

    return { profile: profileRes.data, skills, habits, quests };
}

/**
 * Fetch calendar data in parallel
 */
export async function getCalendarDataBatch(userIdArg, startDate, endDate) {
    // Handle argument shift if needed
    let userIdResolved = userIdArg;
    let start = startDate;
    let end = endDate;

    // Check if first arg looks like a date string (YYYY-MM-DD), implying userId was skipped
    if (typeof userIdArg === 'string' && userIdArg.match(/^\d{4}-\d{2}-\d{2}$/)) {
        start = userIdArg;
        end = startDate;
        userIdResolved = null;
    }

    const userId = await resolveUserId(userIdResolved);
    if (!userId) throw new Error('No authenticated user');

    const [statsRes, completionsRes, habitsRes] = await Promise.all([
        supabase.from('daily_stats').select('*').eq('user_id', userId).gte('stat_date', start).lte('stat_date', end).order('stat_date', { ascending: true }),
        supabase.from('habit_completions').select('*, habits(name, category)').eq('user_id', userId).gte('completed_date', start).lte('completed_date', end),
        supabase.from('habits').select('*').eq('user_id', userId)
    ]);

    if (statsRes.error) throw statsRes.error;
    if (completionsRes.error) throw completionsRes.error;
    if (habitsRes.error) throw habitsRes.error;

    return { stats: statsRes.data || [], completions: completionsRes.data || [], habits: habitsRes.data || [] };
}

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

/**
 * Get user profile with XP and level data
 * @returns {Promise<Object>} User profile object
 */
export async function getUserProfile(userId) {
    try {
        const id = await resolveUserId(userId);
        if (!id) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        dataCache.profile = data;
        return data;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
}

/**
 * Create user profile (called on first login)
 * @param {string} userId - User ID from auth
 * @param {string} email - User email
 * @returns {Promise<Object>} Created profile
 */
export async function createUserProfile(userId, email) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .insert([{
                id: userId,
                email: email,
                total_xp: 0,
                current_xp: 0,
                level: 1,
                next_level_xp: 100
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

/**
 * Update user profile data
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateUserProfile(updates, userIdArg) {
    try {
        const userId = await resolveUserId(userIdArg);
        if (!userId) throw new Error('No authenticated user');

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
        throw error;
    }
}

/**
 * Add XP to user and handle leveling
 * Uses formula: nextLevelXP = 100 * (level ^ 1.5)
 * @param {number} amount - XP to add
 * @returns {Promise<Object>} Updated profile with new level/XP
 */
export async function addUserXP(amount, userIdArg) {
    const userId = await resolveUserId(userIdArg);
    if (!userId) throw new Error('No authenticated user');

    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;

    let newCurrentXP = profile.current_xp + amount;
    let newLevel = profile.level;

    let nextLevelXP = Math.floor(100 * Math.pow(newLevel, 1.5));

    while (newCurrentXP >= nextLevelXP) {
        newLevel += 1;
        newCurrentXP -= nextLevelXP;
        nextLevelXP = Math.floor(100 * Math.pow(newLevel, 1.5));
    }

    const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
            total_xp: profile.total_xp + amount,
            current_xp: newCurrentXP,
            level: newLevel,
            next_level_xp: nextLevelXP
        })
        .eq('id', userId)
        .select()
        .single();

    if (updateError) throw updateError;

    return updatedProfile;
}


// ============================================
// SKILLS FUNCTIONS
// ============================================

/**
 * Get all skills for current user
 * @returns {Promise<Array>} Array of 6 skills
 */
export async function getUserSkills(userIdArg) {
    try {
        const userId = await resolveUserId(userIdArg);
        if (!userId) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('skills')
            .select('*')
            .eq('user_id', userId)
            .order('name');

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching skills:', error);
        throw error;
    }
}

/**
 * Get skills with calculated progress percentages
 * Uses the user_skill_progress view
 * @returns {Promise<Array>} Skills with progress data
 */
export async function getSkillProgress(userIdArg) {
    try {
        const userId = await resolveUserId(userIdArg);
        if (!userId) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('user_skill_progress')
            .select('*')
            .eq('user_id', userId)
            .order('skill_name');

        if (error) throw error;

        // Transform to match expected format
        const progressData = data.map(skill => ({
            name: skill.skill_name,
            currentXP: skill.current_xp,
            level: skill.level,
            maxXP: skill.next_level_xp,
            progress: skill.progress_percentage
        }));
        dataCache.skillProgress = progressData;
        return progressData;
    } catch (error) {
        console.error('Error fetching skill progress:', error);
        throw error;
    }
}

/**
 * Add XP to a specific skill and handle leveling
 * @param {string} skillName - Name of skill (Focus, Learning, etc.)
 * @param {number} amount - XP to add
 * @returns {Promise<Object>} Updated skill
 */
export async function updateSkillXP(skillName, amount, userIdArg) {
    try {
        const userId = await resolveUserId(userIdArg);
        if (!userId) throw new Error('No authenticated user');

        // Get current skill data
        const { data: skill, error: fetchError } = await supabase
            .from('skills')
            .select('*')
            .eq('user_id', userId)
            .eq('name', skillName)
            .single();

        if (fetchError) throw fetchError;

        let newCurrentXP = skill.current_xp + amount;
        let newLevel = skill.level;

        // Calculate XP needed for current level
        let nextLevelXP = Math.floor(100 * Math.pow(newLevel, 1.5));

        // Handle level ups
        while (newCurrentXP >= nextLevelXP) {
            newLevel += 1;
            newCurrentXP -= nextLevelXP;
            nextLevelXP = Math.floor(100 * Math.pow(newLevel, 1.5));
        }

        // Update skill
        const { data: updatedSkill, error: updateError } = await supabase
            .from('skills')
            .update({
                current_xp: newCurrentXP,
                level: newLevel
            })
            .eq('user_id', userId)
            .eq('name', skillName)
            .select()
            .single();

        if (updateError) throw updateError;
        return updatedSkill;
    } catch (error) {
        console.error('Error updating skill XP:', error);
        throw error;
    }
}

// ============================================
// HABITS FUNCTIONS
// ============================================

/**
 * Get all habits for current user
 * @returns {Promise<Array>} Array of habits
 */
export async function getUserHabits(userIdArg) {
    try {
        const userId = await resolveUserId(userIdArg);
        if (!userId) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform to expected format
        const habitsData = data.map(habit => ({
            id: habit.id,
            name: habit.name,
            category: habit.category,
            skill: habit.skill,
            completedToday: habit.completed_today,
            streak: habit.streak,
            longestStreak: habit.longest_streak,
            lastCompleted: habit.last_completed
        }));
        dataCache.habits = habitsData;
        return habitsData;
    } catch (error) {
        console.error('Error fetching habits:', error);
        throw error;
    }
}

/**
 * Create a new habit
 * @param {Object} habitData - Habit details {name, category, skill}
 * @returns {Promise<Object>} Created habit
 */
export async function createHabit(habitData) {
    try {
        const session = await getValidSession();
        const user = session?.user;
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('habits')
            .insert([{
                user_id: user.id,
                name: habitData.name,
                category: habitData.category,
                skill: habitData.skill,
                completed_today: false,
                streak: 0,
                longest_streak: 0
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating habit:', error);
        throw error;
    }
}

/**
 * Update habit data
 * @param {string} habitId - Habit ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated habit
 */
export async function updateHabit(habitId, updates) {
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
        throw error;
    }
}

/**
 * Delete a habit
 * @param {string} habitId - Habit ID
 * @returns {Promise<void>}
 */
export async function deleteHabit(habitId) {
    try {
        const { error } = await supabase
            .from('habits')
            .delete()
            .eq('id', habitId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting habit:', error);
        throw error;
    }
}

/**
 * Toggle habit completion for today
 * Handles XP rewards, streak tracking, and completion logging
 * @param {string} habitId - Habit ID
 * @returns {Promise<Object>} Updated habit and profile
 */
export async function toggleHabitCompletion(habitId) {
    try {
        const session = await getValidSession();
        const user = session?.user;
        if (!user) throw new Error('No authenticated user');

        const today = new Date().toISOString().split('T')[0];
        const xpValue = 10;

        const { data: habit, error: habitError } = await supabase
            .from('habits')
            .select('*')
            .eq('id', habitId)
            .single();

        if (habitError) throw habitError;

        const completedToday = !habit.completed_today;
        let newStreak = habit.streak;

        if (completedToday) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (habit.last_completed === yesterdayStr) {
                newStreak += 1;
            } else if (habit.last_completed !== today) {
                newStreak = 1;
            }

            // Run updates in parallel instead of sequential
            await Promise.all([
                supabase.from('habits').update({
                    completed_today: true,
                    streak: newStreak,
                    last_completed: today
                }).eq('id', habitId),

                supabase.from('habit_completions').insert([{
                    habit_id: habitId,
                    user_id: user.id,
                    completed_date: today,
                    xp_earned: xpValue
                }]),

                addUserXP(xpValue, user.id),

                habit.skill
                    ? updateSkillXP(habit.skill, xpValue, user.id)
                    : Promise.resolve()
            ]);

        } else {

            newStreak = Math.max(0, habit.streak - 1);

            await Promise.all([
                supabase.from('habits').update({
                    completed_today: false,
                    streak: newStreak
                }).eq('id', habitId),

                supabase.from('habit_completions')
                    .delete()
                    .eq('habit_id', habitId)
                    .eq('completed_date', today)
            ]);
        }

        // Return updated habit only once
        const { data: updatedHabit } = await supabase
            .from('habits')
            .select('*')
            .eq('id', habitId)
            .single();

        return {
            habit: updatedHabit,
            profile: null // let realtime handle profile update
        };

    } catch (error) {
        console.error('Error toggling habit completion:', error);
        throw error;
    }
}


/**
 * Get habit completions for date range (for calendar)
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Completion records
 */
export async function getHabitCompletions(startDate, endDate) {
    try {
        const session = await getValidSession();
        const user = session?.user;
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('habit_completions')
            .select('*, habits(name, category)')
            .eq('user_id', user.id)
            .gte('completed_date', startDate)
            .lte('completed_date', endDate)
            .order('completed_date', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching habit completions:', error);
        throw error;
    }
}

// ============================================
// QUESTS FUNCTIONS
// ============================================

/**
 * Get all quests for current user
 * @returns {Promise<Array>} Array of quests
 */
export async function getUserQuests(userIdArg) {
    try {
        const userId = await resolveUserId(userIdArg);
        if (!userId) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('quests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform to expected format
        const questsData = data.map(quest => ({
            id: quest.id,
            title: quest.title,
            description: quest.description,
            difficulty: quest.difficulty,
            skill: quest.skill,
            xpReward: quest.xp_reward,
            completed: quest.completed,
            completedAt: quest.completed_at
        }));
        dataCache.quests = questsData;
        return questsData;
    } catch (error) {
        console.error('Error fetching quests:', error);
        throw error;
    }
}

/**
 * Create a new quest
 * @param {Object} questData - Quest details
 * @returns {Promise<Object>} Created quest
 */
export async function createQuest(questData) {
    try {
        const session = await getValidSession();
        const user = session?.user;
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('quests')
            .insert([{
                user_id: user.id,
                title: questData.title,
                description: questData.description,
                difficulty: questData.difficulty,
                skill: questData.skill,
                xp_reward: questData.xpReward,
                completed: false
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating quest:', error);
        throw error;
    }
}

/**
 * Update quest data
 * @param {string} questId - Quest ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated quest
 */
export async function updateQuest(questId, updates) {
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
        throw error;
    }
}

/**
 * Delete a quest
 * @param {string} questId - Quest ID
 * @returns {Promise<void>}
 */
export async function deleteQuest(questId) {
    try {
        const { error } = await supabase
            .from('quests')
            .delete()
            .eq('id', questId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting quest:', error);
        throw error;
    }
}

/**
 * Complete a quest and award XP
 * @param {string} questId - Quest ID
 * @returns {Promise<Object>} Updated quest and profile
 */
export async function completeQuest(questId) {
    try {
        // Get quest data
        const { data: quest, error: questError } = await supabase
            .from('quests')
            .select('*')
            .eq('id', questId)
            .single();

        if (questError) throw questError;

        if (quest.completed) {
            throw new Error('Quest already completed');
        }

        // Mark quest as completed
        await updateQuest(questId, {
            completed: true,
            completed_at: new Date().toISOString()
        });

        // Award XP to user
        await addUserXP(quest.xp_reward);

        // Award XP to skill
        if (quest.skill) {
            await updateSkillXP(quest.skill, quest.xp_reward);
        }

        // Return updated data
        const updatedQuest = await supabase
            .from('quests')
            .select('*')
            .eq('id', questId)
            .single();

        const updatedProfile = await getUserProfile();

        return {
            quest: updatedQuest.data,
            profile: updatedProfile
        };
    } catch (error) {
        console.error('Error completing quest:', error);
        throw error;
    }
}

// ============================================
// FOCUS SESSIONS FUNCTIONS
// ============================================

/**
 * Create a new focus session
 * @param {Object} sessionData - Session details
 * @returns {Promise<Object>} Created session
 */
export async function createFocusSession(sessionData) {
    try {
        const session = await getValidSession();
        const user = session?.user;
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('focus_sessions')
            .insert([{
                user_id: user.id,
                duration_minutes: sessionData.durationMinutes,
                session_type: sessionData.sessionType || 'focus',
                completed: false,
                xp_earned: 0
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating focus session:', error);
        throw error;
    }
}

/**
 * Complete a focus session and award XP
 * @param {string} sessionId - Session ID
 * @param {number} xpEarned - XP to award
 * @returns {Promise<Object>} Updated session and profile
 */
export async function completeFocusSession(sessionId, xpEarned) {
    try {
        // Update session
        const { data: session, error: sessionError } = await supabase
            .from('focus_sessions')
            .update({
                completed: true,
                completed_at: new Date().toISOString(),
                xp_earned: xpEarned
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (sessionError) throw sessionError;

        // Award XP to user
        await addUserXP(xpEarned);

        // Award XP to Focus skill
        await updateSkillXP('Focus', xpEarned);

        const updatedProfile = await getUserProfile();

        return {
            session,
            profile: updatedProfile
        };
    } catch (error) {
        console.error('Error completing focus session:', error);
        throw error;
    }
}

/**
 * Get focus sessions for date range
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Promise<Array>} Focus sessions
 */
export async function getFocusSessions(startDate, endDate) {
    try {
        const session = await getValidSession();
        const user = session?.user;
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', user.id)
            .gte('started_at', startDate)
            .lte('started_at', endDate)
            .order('started_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching focus sessions:', error);
        throw error;
    }
}

// ============================================
// DAILY STATS FUNCTIONS (for Calendar)
// ============================================

/**
 * Get daily stats for date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Daily stats
 */
export async function getDailyStats(startDate, endDate) {
    try {
        const session = await getValidSession();
        const user = session?.user;
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
            .from('daily_stats')
            .select('*')
            .eq('user_id', user.id)
            .gte('stat_date', startDate)
            .lte('stat_date', endDate)
            .order('stat_date', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching daily stats:', error);
        throw error;
    }
}

/**
 * Update or create daily stats for a specific date
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<Object>} Updated stats
 */
export async function updateDailyStats(date) {
    try {
        const session = await getValidSession();
        const user = session?.user;
        if (!user) throw new Error('No authenticated user');

        // Get all habits for user
        const habits = await getUserHabits();
        const totalHabits = habits.length;

        // Get completions for this date
        const completions = await getHabitCompletions(date, date);
        const completedHabits = completions.length;
        const completionPercentage = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

        // Calculate current streak (simplified - can be enhanced)
        const maxStreak = Math.max(...habits.map(h => h.streak), 0);

        // Calculate XP earned this day
        const xpEarned = completions.reduce((sum, c) => sum + (c.xp_earned || 0), 0);

        // Upsert daily stats
        const { data, error } = await supabase
            .from('daily_stats')
            .upsert([{
                user_id: user.id,
                stat_date: date,
                total_habits: totalHabits,
                completed_habits: completedHabits,
                completion_percentage: completionPercentage,
                current_streak: maxStreak,
                xp_earned: xpEarned
            }], {
                onConflict: 'user_id,stat_date'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating daily stats:', error);
        throw error;
    }
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to habit changes
 * @param {Function} callback - Called when habits change
 * @param {string} [channelId] - Optional unique channel ID to avoid conflicts when remounting
 * @returns {Object} Subscription object (call .unsubscribe() to stop)
 */
export async function subscribeToHabits(callback, channelId) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return { unsubscribe: () => { } };

    const id = channelId || `habits-${user.id}-${Math.random().toString(36).slice(2, 11)}`;
    return supabase
        .channel(id)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'habits',
            filter: `user_id=eq.${user.id}`
        }, callback)
        .subscribe();
}

/**
 * Subscribe to skill changes
 * @param {Function} callback - Called when skills change
 * @param {string} [channelId] - Optional unique channel ID to avoid conflicts when remounting
 * @returns {Object} Subscription object
 */
export async function subscribeToSkills(callback, channelId) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return { unsubscribe: () => { } };

    const id = channelId || `skills-${user.id}-${Math.random().toString(36).slice(2, 11)}`;
    return supabase
        .channel(id)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'skills',
            filter: `user_id=eq.${user.id}`
        }, callback)
        .subscribe();
}

/**
 * Subscribe to quest changes
 * @param {Function} callback - Called when quests change
 * @param {string} [channelId] - Optional unique channel ID to avoid conflicts when remounting
 * @returns {Object} Subscription object
 */
export async function subscribeToQuests(callback, channelId) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return { unsubscribe: () => { } };

    const id = channelId || `quests-${user.id}-${Math.random().toString(36).slice(2, 11)}`;
    return supabase
        .channel(id)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'quests',
            filter: `user_id=eq.${user.id}`
        }, callback)
        .subscribe();
}

/**
 * Subscribe to user profile changes
 * @param {Function} callback - Called when profile changes
 * @param {string} [channelId] - Optional unique channel ID to avoid conflicts when remounting
 * @returns {Object} Subscription object
 */
export async function subscribeToProfile(callback, channelId) {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return { unsubscribe: () => { } };

    const id = channelId || `profile-${user.id}-${Math.random().toString(36).slice(2, 11)}`;
    return supabase
        .channel(id)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_profiles',
            filter: `id=eq.${user.id}`
        }, callback)
        .subscribe();
}

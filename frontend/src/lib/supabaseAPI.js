/**
 * Supabase Database API Layer
 * Handles all CRUD operations for the Looped application
*/

import { supabase, waitForSupabaseReady } from './supabaseClient';
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
// SESSION MANAGEMENT WITH CACHING
// ============================================

// Session cache to prevent hanging on background tabs
let cachedSession = null;
let sessionFetchTime = 0;
const SESSION_CACHE_MS = 2000; // Cache for 2 seconds

/**
 * Get session with timeout and caching to prevent hangs
 */
async function getCachedSession() {
    const now = Date.now();
    
    // Return cached session if fresh
    if (cachedSession && (now - sessionFetchTime) < SESSION_CACHE_MS) {
        console.log('🔐 Using cached session');
        return cachedSession;
    }
    
    try {
        console.log('🔐 Fetching fresh session with timeout...');
        
        // Try direct getSession first with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session timeout')), 3000)
        );
        
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (result.error) {
            console.error('🔐 Session error:', result.error);
            // On error, try to refresh if we have cached session
            if (cachedSession) {
                console.log('🔐 Attempting to refresh stale session...');
                try {
                    const { data: { session: refreshed }, error: refreshError } = 
                        await supabase.auth.refreshSession();
                    if (!refreshError && refreshed) {
                        cachedSession = refreshed;
                        sessionFetchTime = now;
                        console.log('🔐 Session refreshed successfully');
                        return refreshed;
                    }
                } catch (refreshErr) {
                    console.error('🔐 Refresh failed:', refreshErr);
                }
            }
            return cachedSession;
        }
        
        // Update cache
        cachedSession = result.data.session;
        sessionFetchTime = now;
        
        console.log('🔐 Fresh session obtained:', !!cachedSession);
        return cachedSession;
        
    } catch (err) {
        console.error('🔐 Session fetch timed out:', err.message);
        
        // CRITICAL FIX: If timeout, force refresh the session
        if (cachedSession) {
            console.log('🔐 Timeout detected - forcing session refresh...');
            try {
                const { data: { session: refreshed }, error: refreshError } = 
                    await Promise.race([
                        supabase.auth.refreshSession(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Refresh timeout')), 3000)
                        )
                    ]);
                
                if (!refreshError && refreshed) {
                    cachedSession = refreshed;
                    sessionFetchTime = now;
                    console.log('🔐 Forced refresh successful');
                    return refreshed;
                }
            } catch (refreshErr) {
                console.error('🔐 Forced refresh also timed out:', refreshErr.message);
            }
        }
        
        // Last resort: return stale cache
        console.log('🔐 Returning stale cached session');
        return cachedSession;
    }
}

/**
 * Get a valid session, refreshing if needed (with caching)
 */
async function getValidSession() {
    const session = await getCachedSession();
    
    if (!session) {
        console.log('🔐 No session available');
        return null;
    }

    // Check if access token is expired or expiring soon
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;
    
    // Refresh if expiring in < 5 minutes
    if (expiresAt && timeUntilExpiry < 300) {
        console.log('🔐 Session expiring soon, refreshing...');
        
        try {
            const { data: { session: newSession }, error: refreshError } = 
                await supabase.auth.refreshSession();
            
            if (refreshError) {
                console.error('🔐 Session refresh failed:', refreshError);
                return session; // Return old session
            }
            
            // Update cache
            cachedSession = newSession;
            sessionFetchTime = Date.now();
            
            console.log('🔐 Session refreshed successfully');
            return newSession;
        } catch (refreshErr) {
            console.error('🔐 Refresh error:', refreshErr);
            return session; // Return old session
        }
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
    console.log('👤 resolveUserId called with:', providedId);
    
    if (providedId) {
        console.log('👤 Using provided ID:', providedId);
        return providedId;
    }
    
    // Use getUser instead of getSession - it's more reliable after background
    try {
        const { data: { user }, error } = await Promise.race([
            supabase.auth.getUser(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('getUser timeout')), 3000)
            )
        ]);
        
        if (error || !user) {
            console.error('👤 getUser failed:', error);
            // Fallback to cached session
            const session = await getCachedSession();
            const userId = session?.user?.id;
            console.log('👤 Using cached session, user ID:', userId);
            return userId;
        }
        
        const userId = user.id;
        console.log('👤 Resolved user ID from getUser:', userId);
        return userId;
        
    } catch (err) {
        console.error('👤 resolveUserId error:', err.message);
        // Last resort: cached session
        const session = await getCachedSession();
        const userId = session?.user?.id;
        console.log('👤 Emergency fallback to cache, user ID:', userId);
        return userId;
    }
}

/**
 * Fetch all dashboard data in parallel (profile + habits + quests)
 * ~3x faster than sequential fetches
 */

export async function getDashboardDataBatch(userIdArg) {
    console.log('🔍 getDashboardDataBatch called');
    
    // CRITICAL: Ensure Supabase is ready
    await waitForSupabaseReady();
    
    const userId = await resolveUserId(userIdArg);
    console.log('🔍 User ID resolved:', userId);
    
    if (!userId) {
        console.error('❌ No user ID - throwing error');
        throw new Error('No authenticated user');
    }

    console.log('🔍 Fetching profile, habits, quests in parallel...');
    
    const [profileRes, habitsRes, questsRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', userId).single(),
        supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('quests').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ]);

    console.log('🔍 Responses received - Profile:', !!profileRes.data, 'Habits:', habitsRes.data?.length, 'Quests:', questsRes.data?.length);

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
    
    console.log('✅ Returning dashboard data');
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
    dataCache.habits = habits;

    return { profile: profileRes.data, skills, habits, quests };
}

/**
 * Fetch calendar data in parallel
 */
export async function getCalendarDataBatch(userIdArg, startDate, endDate) {
    let userIdResolved = userIdArg;
    let start = startDate;
    let end = endDate;

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
 * Add XP to user and handle leveling (OPTIMIZED - no redundant fetch)
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
 */
export async function updateSkillXP(skillName, amount, userIdArg) {
    try {
        const userId = await resolveUserId(userIdArg);
        if (!userId) throw new Error('No authenticated user');

        const { data: skill, error: fetchError } = await supabase
            .from('skills')
            .select('*')
            .eq('user_id', userId)
            .eq('name', skillName)
            .single();

        if (fetchError) throw fetchError;

        let newCurrentXP = skill.current_xp + amount;
        let newLevel = skill.level;
        let nextLevelXP = Math.floor(100 * Math.pow(newLevel, 1.5));

        while (newCurrentXP >= nextLevelXP) {
            newLevel += 1;
            newCurrentXP -= nextLevelXP;
            nextLevelXP = Math.floor(100 * Math.pow(newLevel, 1.5));
        }

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
 * Toggle habit completion for today (OPTIMIZED - parallel updates)
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

            // OPTIMIZED: Run all updates in parallel
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

        // Return updated habit (realtime handles profile update)
        const { data: updatedHabit } = await supabase
            .from('habits')
            .select('*')
            .eq('id', habitId)
            .single();

        return {
            habit: updatedHabit,
            profile: null // Let realtime subscriptions handle profile updates
        };

    } catch (error) {
        console.error('Error toggling habit completion:', error);
        throw error;
    }
}

/**
 * Get habit completions for date range (for calendar)
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
 * Complete a quest and award XP (OPTIMIZED - removed redundant getUserProfile)
 */
export async function completeQuest(questId) {
    try {
        const { data: quest, error: questError } = await supabase
            .from('quests')
            .select('*')
            .eq('id', questId)
            .single();

        if (questError) throw questError;

        if (quest.completed) {
            throw new Error('Quest already completed');
        }

        // Run in parallel
        await Promise.all([
            updateQuest(questId, {
                completed: true,
                completed_at: new Date().toISOString()
            }),
            addUserXP(quest.xp_reward),
            quest.skill ? updateSkillXP(quest.skill, quest.xp_reward) : Promise.resolve()
        ]);

        const updatedQuest = await supabase
            .from('quests')
            .select('*')
            .eq('id', questId)
            .single();

        return {
            quest: updatedQuest.data,
            profile: null // Let realtime subscriptions handle profile updates
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
 * Complete a focus session and award XP (OPTIMIZED)
 */
export async function completeFocusSession(sessionId, xpEarned) {
    try {
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

        // Run XP updates in parallel
        await Promise.all([
            addUserXP(xpEarned),
            updateSkillXP('Focus', xpEarned)
        ]);

        return {
            session,
            profile: null // Let realtime subscriptions handle profile updates
        };
    } catch (error) {
        console.error('Error completing focus session:', error);
        throw error;
    }
}

/**
 * Get focus sessions for date range
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
 */
export async function updateDailyStats(date) {
    try {
        const session = await getValidSession();
        const user = session?.user;
        if (!user) throw new Error('No authenticated user');

        const habits = await getUserHabits();
        const totalHabits = habits.length;

        const completions = await getHabitCompletions(date, date);
        const completedHabits = completions.length;
        const completionPercentage = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

        const maxStreak = Math.max(...habits.map(h => h.streak), 0);
        const xpEarned = completions.reduce((sum, c) => sum + (c.xp_earned || 0), 0);

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

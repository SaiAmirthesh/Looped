import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import XPBar from '../components/XPBar';
import StatCard from '../components/StatCard';
import HabitCard from '../components/HabitCard';
import QuestCard from '../components/QuestCard';
import { Target, Trophy, Flame, TrendingUp } from 'lucide-react';
import { getDashboardDataBatch, toggleHabitCompletion, completeQuest, subscribeToProfile, subscribeToHabits, subscribeToQuests } from '../lib/supabaseAPI';
import { usePageVisibilityRefetch } from '../lib/usePageVisibilityRefetch';
import { useDebouncedCallback } from '../lib/useDebouncedCallback';
import { PageTransition } from '../components/ui/PageTransition';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playerStats, setPlayerStats] = useState({
        level: 1,
        currentXP: 0,
        maxXP: 100,
        totalXP: 0
    });
    const [dailyHabits, setDailyHabits] = useState([]);
    const [activeQuests, setActiveQuests] = useState([]);
    const [currentStreak, setCurrentStreak] = useState(0);

    const loadDashboardData = useCallback(async (silent = false) => {
    try {
        if (!silent) setLoading(true);
        
        console.log('📊 Starting dashboard data fetch...');
        const result = await getDashboardDataBatch();
        console.log('📊 Dashboard data received:', result);

        if (!result || !result.profile) {
            console.error('❌ No profile data returned!');
            return;
        }

        setPlayerStats({
            level: result.profile.level,
            currentXP: result.profile.current_xp,
            maxXP: result.profile.next_level_xp,
            totalXP: result.profile.total_xp
        });
        console.log('✅ Player stats set:', {
            level: result.profile.level,
            currentXP: result.profile.current_xp,
            maxXP: result.profile.next_level_xp,
            totalXP: result.profile.total_xp
        });

        const todayHabits = result.habits.slice(0, 4).map(h => ({
            id: h.id,
            name: h.name,
            category: h.category,
            streak: h.streak,
            completed: h.completedToday
        }));
        setDailyHabits(todayHabits);
        console.log('✅ Daily habits set:', todayHabits.length, 'habits');

        const maxStreak = result.habits.length > 0 ? Math.max(...result.habits.map(h => h.streak)) : 0;
        setCurrentStreak(maxStreak);

        const active = result.quests.filter(q => !q.completed).slice(0, 2).map(q => ({
            id: q.id,
            title: q.title,
            description: q.description,
            xpReward: q.xpReward,
            difficulty: q.difficulty,
            completed: q.completed
        }));
        setActiveQuests(active);
        console.log('✅ Active quests set:', active.length, 'quests');

    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        console.error('❌ Error details:', error.message, error.stack);
        
        // If it's an auth error, redirect to login
        if (error.message?.includes('No authenticated user')) {
            console.log('🔐 Redirecting to login...');
            navigate('/login');
        }
    } finally {
        setLoading(false);
    }
}, [navigate]);

    // const debouncedRefetch = useDebouncedCallback(loadDashboardData, 300);


    useEffect(() => {
        let habitsSubscription, questsSubscription, profileSubscription;
        let isMounted = true;

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                navigate('/login');
                return;
            }

            if (isMounted) {
                setUser(session.user);
                await loadDashboardData();

                // **FIX**: Use a SINGLE callback for ALL subscriptions
                const handleDataChange = () => {
                    if (isMounted) {
                        // Silent refetch (no loading spinner)
                        loadDashboardData(true);
                    }
                };

                // Subscribe with the same callback
                habitsSubscription = await subscribeToHabits(handleDataChange);
                questsSubscription = await subscribeToQuests(handleDataChange);
                profileSubscription = await subscribeToProfile(handleDataChange);
            }
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login');
            } else if (isMounted) {
                setUser(session.user);
                loadDashboardData();
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            habitsSubscription?.unsubscribe();
            questsSubscription?.unsubscribe();
            profileSubscription?.unsubscribe();
        };
    }, [navigate, loadDashboardData]);

    usePageVisibilityRefetch(() => loadDashboardData(true));

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleToggleHabit = async (habitId) => {
        // Optimistic update - toggle immediately
        setDailyHabits(prev =>
            prev.map(h => (h.id === habitId ? { ...h, completed: !h.completed } : h))
        );
        try {
            await toggleHabitCompletion(habitId);
            // Refetch to sync streak and other computed data
            await loadDashboardData();
        } catch (error) {
            console.error('Error toggling habit:', error);
            // Revert on error
            setDailyHabits(prev =>
                prev.map(h => (h.id === habitId ? { ...h, completed: !h.completed } : h))
            );
        }
    };

    const handleToggleQuest = async (questId) => {
        // Optimistic update - remove from list (completed quests are filtered out)
        setActiveQuests(prev => prev.filter(q => q.id !== questId));
        try {
            await completeQuest(questId);
            // Refetch to update XP and stats
            await loadDashboardData();
        } catch (error) {
            console.error('Error completing quest:', error);
            // Revert - reload to restore state
            await loadDashboardData();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your adventure...</p>
                </div>
            </div>
        );
    }

    const habitsCompleteCount = dailyHabits.filter(h => h.completed).length;

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
                <PageTransition>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">
                                Welcome back, {user?.email?.split('@')[0] || 'Adventurer'}!
                            </h1>
                            <p className="text-muted-foreground">Ready to level up today?</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition bg-primary text-foreground"
                        >
                            Logout
                        </button>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-foreground mb-4">Player Stats</h2>
                        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                            <XPBar
                                currentXP={playerStats.currentXP}
                                maxXP={playerStats.maxXP}
                                level={playerStats.level}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard index={0} title="Total XP" value={playerStats.totalXP.toLocaleString()} icon={<Trophy className="w-6 h-6 text-primary" />} subtitle="All time" />
                        <StatCard index={1} title="Habits Completed" value={habitsCompleteCount.toString()} icon={<Target className="w-6 h-6 text-chart-2" />} subtitle="Today" />
                        <StatCard index={2} title="Current Streak" value={`${currentStreak} days`} icon={<Flame className="w-6 h-6 text-chart-1" />} subtitle="Keep it up!" />
                        <StatCard index={3} title="Level Progress" value={`${Math.round((playerStats.currentXP / playerStats.maxXP) * 100)}%`} icon={<TrendingUp className="w-6 h-6 text-chart-4" />} subtitle="To next level" />
                    </div>

                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-foreground">Daily Habits</h2>
                            <span className="text-sm text-muted-foreground">
                                {dailyHabits.filter(h => h.completed).length} / {dailyHabits.length} completed
                            </span>
                        </div>
                        <div className="space-y-3 w-200">
                            {dailyHabits.map(habit => (
                                <HabitCard
                                    key={habit.id}
                                    name={habit.name}
                                    streak={habit.streak}
                                    completed={habit.completed}
                                    category={habit.category}
                                    onToggle={() => handleToggleHabit(habit.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-foreground mb-4">Active Quests</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-30 ">
                            {activeQuests.map(quest => (
                                <QuestCard
                                    key={quest.id}
                                    title={quest.title}
                                    description={quest.description}
                                    xpReward={quest.xpReward}
                                    difficulty={quest.difficulty}
                                    onToggle={() => handleToggleQuest(quest.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mt-15 bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20 rounded-lg p-6">
                        <h3 className="text-lg text-foreground font-semibold mb-4">Quick Actions</h3>
                        <div className="flex gap-4 flex-wrap">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/habits')} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition">
                                Add New Habit
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/focus')} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition">
                                Start Focus Session
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/calendar')} className="px-4 py-2 bg-chart-5 text-secondary-foreground rounded-md hover:opacity-90 transition">
                                View Calendar
                            </motion.button>
                        </div>
                    </div>
                </PageTransition>
            </main>
        </div>
    );
};

export default Dashboard;

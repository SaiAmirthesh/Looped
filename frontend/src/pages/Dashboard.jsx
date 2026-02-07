import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import XPBar from '../components/XPBar';
import StatCard from '../components/StatCard';
import HabitCard from '../components/HabitCard';
import QuestCard from '../components/QuestCard';
import { Target, Trophy, Flame, TrendingUp } from 'lucide-react';
import { getData, generateKey, setData } from '../lib/storage';

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

    useEffect(() => {
        // Check if user is authenticated
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                navigate('/login');
                return;
            }

            loadDashboardData(session.user.id);
            setUser(session.user);
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
                loadDashboardData(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const loadDashboardData = (userId) => {
        // Load XP data
        const xpKey = generateKey(userId, 'xp');
        const xpData = getData(xpKey, { totalXP: 0, level: 1, currentXP: 0, nextLevelXP: 100 });
        // normalize to `maxXP` for XPBar compatibility
        setPlayerStats({ ...xpData, maxXP: xpData.nextLevelXP });

        // Load habits
        const habitsKey = generateKey(userId, 'habits');
        const habits = getData(habitsKey, []);
        const todayHabits = habits.slice(0, 4).map(h => ({
            id: h.id,
            title: h.title,
            category: h.category,
            streak: h.streak,
            completed: h.completedToday
        }));
        setDailyHabits(todayHabits);

        // Calculate current streak
        const streaks = habits.map(h => h.streak);
        const maxStreak = streaks.length > 0 ? Math.max(...streaks) : 0;
        setCurrentStreak(maxStreak);

        // Load quests
        const questsKey = generateKey(userId, 'quests');
        const quests = getData(questsKey, []);
        const active = quests.filter(q => !q.completed).slice(0, 2).map(q => ({
            id: q.id,
            title: q.title,
            description: q.description,
            xpReward: q.xpReward,
            difficulty: q.difficulty,
            completed: q.completed
        }));
        setActiveQuests(active);

        setLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const addSkillXP = (skillName, amount) => {
        if (!user) return;

        const skillsKey = generateKey(user.id, 'skills');
        const defaultSkills = [
            { name: 'Focus', currentXP: 0, level: 1 },
            { name: 'Learning', currentXP: 0, level: 1 },
            { name: 'Health', currentXP: 0, level: 1 },
            { name: 'Creativity', currentXP: 0, level: 1 },
            { name: 'Confidence', currentXP: 0, level: 1 },
            { name: 'Social', currentXP: 0, level: 1 }
        ];
        let skills = getData(skillsKey, defaultSkills);

        // Add XP to the specified skill with leveling formula
        skills = skills.map(skill => {
            if (skill.name === skillName) {
                const newXP = skill.currentXP + amount;
                const nextLevelXP = Math.floor(100 * Math.pow(skill.level, 1.5));
                const levelUp = newXP >= nextLevelXP;

                return {
                    ...skill,
                    currentXP: levelUp ? newXP - nextLevelXP : newXP,
                    level: levelUp ? skill.level + 1 : skill.level
                };
            }
            return skill;
        });

        setData(skillsKey, skills);
    };

    const handleToggleHabit = (habitId) => {
        const habitsKey = generateKey(user.id, 'habits');
        const habits = getData(habitsKey, []);
        const today = new Date().toISOString().split('T')[0];

        const updatedHabits = habits.map(habit => {
            if (habit.id === habitId) {
                const completedToday = !habit.completedToday;
                const xpValue = 10;

                // Handle XP with proper leveling formula
                const xpKey = generateKey(user.id, 'xp');
                const currentXP = getData(xpKey, { totalXP: 0, level: 1, currentXP: 0, nextLevelXP: 100 });
                const newCurrentXP = currentXP.currentXP + (completedToday ? xpValue : -xpValue);

                let newLevel = currentXP.level;
                let finalCurrentXP = newCurrentXP;
                let newNextLevelXP = currentXP.nextLevelXP;

                if (newCurrentXP >= currentXP.nextLevelXP) {
                    newLevel = currentXP.level + 1;
                    finalCurrentXP = newCurrentXP - currentXP.nextLevelXP;
                    newNextLevelXP = Math.floor(100 * Math.pow(newLevel, 1.5));
                }

                const updatedXP = {
                    totalXP: Math.max(0, currentXP.totalXP + (completedToday ? xpValue : -xpValue)),
                    level: newLevel,
                    currentXP: Math.max(0, finalCurrentXP),
                    nextLevelXP: newNextLevelXP
                };
                setData(xpKey, updatedXP);
                setPlayerStats(updatedXP);

                // Add XP to the habit's associated skill
                if (habit.skill) {
                    addSkillXP(habit.skill, 10);
                }

                if (completedToday) {
                    const lastCompleted = habit.lastCompleted === today ? habit.lastCompleted : today;
                    const sameDay = habit.lastCompleted === today;
                    return {
                        ...habit,
                        completedToday: true,
                        lastCompleted: lastCompleted,
                        streak: sameDay ? habit.streak : habit.streak + 1
                    };
                } else {
                    return {
                        ...habit,
                        completedToday: false
                    };
                }
            }
            return habit;
        });

        setData(habitsKey, updatedHabits);
        const updated = updatedHabits.slice(0, 4).map(h => ({
            id: h.id,
            title: h.title,
            category: h.category,
            streak: h.streak,
            completed: h.completedToday
        }));
        setDailyHabits(updated);
    };

    const handleToggleQuest = (questId) => {
        const questsKey = generateKey(user.id, 'quests');
        const quests = getData(questsKey, []);

        const updatedQuests = quests.map(quest => {
            if (quest.id === questId) {
                if (!quest.completed) {
                    // Award XP with proper leveling formula
                    const xpKey = generateKey(user.id, 'xp');
                    const currentXP = getData(xpKey, { totalXP: 0, level: 1, currentXP: 0, nextLevelXP: 100 });
                    const newCurrentXP = currentXP.currentXP + quest.xpReward;

                    let newLevel = currentXP.level;
                    let finalCurrentXP = newCurrentXP;
                    let newNextLevelXP = currentXP.nextLevelXP;

                    if (newCurrentXP >= currentXP.nextLevelXP) {
                        newLevel = currentXP.level + 1;
                        finalCurrentXP = newCurrentXP - currentXP.nextLevelXP;
                        newNextLevelXP = Math.floor(100 * Math.pow(newLevel, 1.5));
                    }

                    const updatedXP = {
                        totalXP: currentXP.totalXP + quest.xpReward,
                        level: newLevel,
                        currentXP: finalCurrentXP,
                        nextLevelXP: newNextLevelXP
                    };
                    setData(xpKey, updatedXP);
                    setPlayerStats(updatedXP);

                    // Add XP to the quest's associated skill
                    if (quest.skill) {
                        addSkillXP(quest.skill, quest.xpReward);
                    }
                }
                return {
                    ...quest,
                    completed: !quest.completed,
                    completedDate: !quest.completed ? new Date().toISOString().split('T')[0] : null
                };
            }
            return quest;
        });

        setData(questsKey, updatedQuests);
        const active = updatedQuests.filter(q => !q.completed).slice(0, 2).map(q => ({
            id: q.id,
            title: q.title,
            description: q.description,
            xpReward: q.xpReward,
            difficulty: q.difficulty,
            completed: q.completed
        }));
        setActiveQuests(active);
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

            <main className="flex-1 ml-10 p-8">
                {/* Header */}
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

                {/* Player Stats */}
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

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total XP"
                        value={playerStats.totalXP.toLocaleString()}
                        icon={<Trophy className="w-6 h-6 text-primary" />}
                        subtitle="All time"
                    />
                    <StatCard
                        title="Habits Completed"
                        value={habitsCompleteCount.toString()}
                        icon={<Target className="w-6 h-6 text-chart-2" />}
                        subtitle="Today"
                    />
                    <StatCard
                        title="Current Streak"
                        value={`${currentStreak} days`}
                        icon={<Flame className="w-6 h-6 text-chart-1" />}
                        subtitle="Keep it up!"
                    />
                    <StatCard
                        title="Level Progress"
                        value={`${Math.round((playerStats.currentXP / playerStats.maxXP) * 100)}%`}
                        icon={<TrendingUp className="w-6 h-6 text-chart-4" />}
                        subtitle="To next level"
                    />
                </div>

                {/* Daily Habits */}
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
                                name={habit.title}
                                streak={habit.streak}
                                completed={habit.completed}
                                category={habit.category}
                                onToggle={() => handleToggleHabit(habit.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Active Quests */}
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

                {/* Quick Actions */}
                <div className="mt-15 bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg text-foreground font-semibold mb-4">Quick Actions</h3>
                    <div className="flex gap-4 flex-wrap">
                        <button
                            onClick={() => navigate('/habits')}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
                        >
                            Add New Habit
                        </button>
                        <button
                            onClick={() => navigate('/focus')}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition"
                        >
                            Start Focus Session
                        </button>
                        <button
                            onClick={() => navigate('/calendar')}
                            className="px-4 py-2 bg-chart-5 text-secondary-foreground rounded-md hover:opacity-90 transition"
                        >
                            View Calendar
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;

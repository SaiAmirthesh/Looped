import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import XPBar from '../components/XPBar';
import HabitCard from '../components/HabitCard';
import QuestCard from '../components/QuestCard';
import { Target, Trophy, Flame, TrendingUp, LogOut, Zap } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [playerStats] = useState({ level: 1, currentXP: 0, maxXP: 100, totalXP: 0 });
    const [dailyHabits, setDailyHabits] = useState([]);
    const [activeQuests, setActiveQuests] = useState([]);
    const [currentStreak] = useState(0);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }
            setUser(session.user);
            setLoading(false);
        };
        checkUser();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) navigate('/login');
            else setUser(session.user);
        });
        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleToggleHabit = (habitId) => {
        setDailyHabits(prev => prev.map(habit => {
            if (habit.id === habitId) {
                const completed = !habit.completed;
                return { ...habit, completed, streak: completed ? habit.streak + 1 : Math.max(0, habit.streak - 1) };
            }
            return habit;
        }));
    };

    const handleToggleQuest = (questId) => {
        setActiveQuests(prev => prev.map(quest =>
            quest.id === questId ? { ...quest, completed: !quest.completed } : quest
        ));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">Loading your adventure...</p>
                </div>
            </div>
        );
    }

    const habitsCompleteCount = dailyHabits.filter(h => h.completed).length;
    const username = user?.email?.split('@')[0] || 'Adventurer';

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 overflow-y-auto">
                {/* Top header bar */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-border" style={{ backgroundColor: 'var(--background)' }}>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Welcome back, <span className="text-primary font-medium">{username}</span></p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* XP Bar */}
                    <div className="bg-card border border-border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-semibold text-foreground">Player Progress</span>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Level {playerStats.level}</span>
                        </div>
                        <XPBar currentXP={playerStats.currentXP} maxXP={playerStats.maxXP} level={playerStats.level} />
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { title: 'Total XP', value: playerStats.totalXP.toLocaleString(), icon: <Trophy className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10', sub: 'All time' },
                            { title: 'Habits Done', value: habitsCompleteCount.toString(), icon: <Target className="w-5 h-5" />, color: 'text-chart-2', bg: 'bg-chart-2/10', sub: 'Today' },
                            { title: 'Streak', value: `${currentStreak}d`, icon: <Flame className="w-5 h-5" />, color: 'text-orange-500', bg: 'bg-orange-500/10', sub: 'Current' },
                            { title: 'Level Progress', value: `${Math.round((playerStats.currentXP / playerStats.maxXP) * 100)}%`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-chart-4', bg: 'bg-chart-4/10', sub: 'To next level' },
                        ].map(stat => (
                            <div key={stat.title} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</span>
                                    <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center ${stat.color}`}>
                                        {stat.icon}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                                <div className="text-xs text-muted-foreground mt-1">{stat.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Two-column layout: Habits + Quests */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Daily Habits */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-foreground">Today's Habits</h2>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                    {habitsCompleteCount}/{dailyHabits.length}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {dailyHabits.length === 0 ? (
                                    <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
                                        <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No habits yet.</p>
                                        <button onClick={() => navigate('/habits')} className="mt-3 text-xs text-primary hover:underline">Add habits →</button>
                                    </div>
                                ) : (
                                    dailyHabits.map(habit => (
                                        <HabitCard
                                            key={habit.id}
                                            name={habit.title}
                                            streak={habit.streak}
                                            completed={habit.completed}
                                            category={habit.category}
                                            onToggle={() => handleToggleHabit(habit.id)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Active Quests */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-foreground">Active Quests</h2>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                    {activeQuests.filter(q => !q.completed).length} active
                                </span>
                            </div>
                            <div className="space-y-3">
                                {activeQuests.length === 0 ? (
                                    <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
                                        <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No quests yet.</p>
                                        <button onClick={() => navigate('/quests')} className="mt-3 text-xs text-primary hover:underline">Add quests →</button>
                                    </div>
                                ) : (
                                    activeQuests.map(quest => (
                                        <QuestCard
                                            key={quest.id}
                                            title={quest.title}
                                            description={quest.description}
                                            xpReward={quest.xpReward}
                                            difficulty={quest.difficulty}
                                            completed={quest.completed}
                                            onToggle={() => handleToggleQuest(quest.id)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-gradient-to-r from-primary/10 via-transparent to-chart-2/10 border border-primary/20 rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wide">Quick Actions</h3>
                        <div className="flex gap-3 flex-wrap">
                            <button onClick={() => navigate('/habits')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium">
                                + Add Habit
                            </button>
                            <button onClick={() => navigate('/quests')} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium">
                                + Add Quest
                            </button>
                            <button onClick={() => navigate('/focus')} className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium text-foreground">
                                Start Focus
                            </button>
                            <button onClick={() => navigate('/calendar')} className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition text-sm font-medium text-foreground">
                                View Calendar
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;

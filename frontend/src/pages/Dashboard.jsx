import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import XPBar from '../components/XPBar';
import StatCard from '../components/StatCard';
import HabitCard from '../components/HabitCard';
import QuestCard from '../components/QuestCard';
import { Target, Trophy, Flame, TrendingUp } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                navigate('/login');
                return;
            }

            setUser(session.user);
            setLoading(false);
        };

        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
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

    // Dummy data
    const playerStats = {
        level: 12,
        currentXP: 750,
        maxXP: 1000,
        totalXP: 12450
    };

    const dailyHabits = [
        { id: 1, title: 'Morning meditation', streak: 7, completed: true },
        { id: 2, title: 'Read for 30 minutes', streak: 3, completed: false },
        { id: 3, title: 'Exercise', streak: 5, completed: true },
        { id: 4, title: 'Drink 8 glasses of water', streak: 12, completed: false },
    ];

    const activeQuests = [
        {
            id: 1,
            title: 'Complete 7-day meditation streak',
            description: 'Meditate every day for a week to unlock inner peace',
            xpReward: 200,
            difficulty: 'medium'
        },
        {
            id: 2,
            title: 'Read 3 books this month',
            description: 'Finish reading three complete books to expand your knowledge',
            xpReward: 500,
            difficulty: 'hard'
        },
    ];

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
                        value="156"
                        icon={<Target className="w-6 h-6 text-chart-2" />}
                        subtitle="This month"
                    />
                    <StatCard
                        title="Current Streak"
                        value="7 days"
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
                                title={habit.title}
                                streak={habit.streak}
                                completed={habit.completed}
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
                            />
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-primary/10 to-chart-2/10 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg text-foreground font-semibold mb-4">Quick Actions</h3>
                    <div className="flex gap-4 flex-wrap">
                        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition">
                            Add New Habit
                        </button>
                        <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition">
                            Start Focus Session
                        </button>
                        <button className="px-4 py-2 bg-chart-5 text-secondary-foreground rounded-md hover:opacity-90 transition">
                            View Calendar
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;

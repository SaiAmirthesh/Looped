import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import XPBar from '../components/XPBar';
import { User, Mail, Trophy, Target, Flame, LogOut } from 'lucide-react';
import SkillRadarChart from '../components/SkillRadarChart';

const DEFAULT_SKILLS = [
    { name: 'Focus', currentXP: 0, level: 1 },
    { name: 'Learning', currentXP: 0, level: 1 },
    { name: 'Health', currentXP: 0, level: 1 },
    { name: 'Creativity', currentXP: 0, level: 1 },
    { name: 'Confidence', currentXP: 0, level: 1 },
    { name: 'Social', currentXP: 0, level: 1 }
];

const DEFAULT_ACHIEVEMENTS = [
    { id: 1, title: 'First Steps', description: 'Created your first habit', unlocked: false },
    { id: 2, title: 'Week Warrior', description: 'Maintained a 7-day streak', unlocked: false },
    { id: 3, title: 'Quest Master', description: 'Completed 10 quests', unlocked: false },
    { id: 4, title: 'Skill Seeker', description: 'Reached level 5 in any skill', unlocked: false },
    { id: 5, title: 'Consistency King', description: 'Completed habits for 30 days straight', unlocked: false },
    { id: 6, title: 'Focus Champion', description: 'Completed 100 Pomodoro sessions', unlocked: false },
];

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [playerStats] = useState({ level: 1, currentXP: 0, maxXP: 100, totalXP: 0 });
    const [skills] = useState(DEFAULT_SKILLS);
    const [achievements] = useState(DEFAULT_ACHIEVEMENTS);

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }
            setUser(session.user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) navigate('/login');
            else setUser(session.user);
        });
        return () => subscription?.unsubscribe();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 ml-10 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
                        <p className="text-muted-foreground">Manage your account and view your progress</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition bg-primary text-foreground"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                                    <User className="w-12 h-12 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground mb-1">
                                    {user?.email?.split('@')[0] || 'Adventurer'}
                                </h2>
                                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {user?.email || 'user@example.com'}
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                    <Trophy className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium text-primary">Level {playerStats.level}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4">Quick Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Member Since</span>
                                    <span className="text-sm font-medium text-foreground">
                                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Jan 2026'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Last Login</span>
                                    <span className="text-sm font-medium text-foreground">Today</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full">
                            <SkillRadarChart skills={skills} />
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card border border-border rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4">Level Progress</h3>
                            <XPBar
                                currentXP={playerStats.currentXP}
                                maxXP={playerStats.maxXP}
                                level={playerStats.level}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Trophy className="w-5 h-5 text-primary" />
                                    <span className="text-muted-foreground text-sm">Total XP</span>
                                </div>
                                <div className="text-3xl font-bold text-foreground">{playerStats.totalXP.toLocaleString()}</div>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="w-5 h-5 text-chart-2" />
                                    <span className="text-muted-foreground text-sm">Habits Completed</span>
                                </div>
                                <div className="text-3xl font-bold text-foreground">0</div>
                            </div>
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Flame className="w-5 h-5 text-chart-1" />
                                    <span className="text-muted-foreground text-sm">Longest Streak</span>
                                </div>
                                <div className="text-3xl font-bold text-foreground">0 days</div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6">
                            <h3 className="font-semibold text-foreground mb-4">Achievements</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {achievements.map(achievement => (
                                    <div
                                        key={achievement.id}
                                        className={`p-4 rounded-lg border transition ${achievement.unlocked
                                            ? 'border-primary/20 bg-primary/5'
                                            : 'border-border bg-muted/50 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${achievement.unlocked ? 'bg-primary/20' : 'bg-muted'}`}>
                                                <Trophy className={`w-5 h-5 ${achievement.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-foreground mb-1">{achievement.title}</h4>
                                                <p className="text-sm text-muted-foreground">{achievement.description}</p>
                                                {achievement.unlocked && (
                                                    <span className="inline-block mt-2 text-xs text-primary font-medium">✓ Unlocked</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/20 rounded-lg p-6 flex gap-10 items-center justify-between">
                            <p className="text-sm text-muted-foreground">Irreversible actions that affect your account</p>
                            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition text-sm">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;

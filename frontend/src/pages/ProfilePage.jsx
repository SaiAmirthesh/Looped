import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import * as db from '../lib/database';
import Navigation from '../components/Navigation';
import XPBar from '../components/XPBar';
import { User, Mail, Trophy, Target, Flame, LogOut, Shield, Camera, Loader2 } from 'lucide-react';
import SkillRadarChart from '../components/SkillRadarChart';
import { useUserProfile } from '../context/UserProfileContext';

const DEFAULT_SKILLS = [
    { name: 'Focus', currentXP: 0, level: 1 },
    { name: 'Learning', currentXP: 0, level: 1 },
    { name: 'Health', currentXP: 0, level: 1 },
    { name: 'Creativity', currentXP: 0, level: 1 },
    { name: 'Confidence', currentXP: 0, level: 1 },
    { name: 'Social', currentXP: 0, level: 1 }
];


const ProfilePage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [skills, setSkills] = useState([]);
    const [stats, setStats] = useState({ habitsCount: 0, bestStreak: 0, questsCompleted: 0, focusCount: 0 });

    // Read from shared context — no local fetch needed
    const { user, profile, updateAvatarUrl } = useUserProfile() ?? {};

    // Fetch skills + habits + quests in parallel — single round-trip batch
    const fetchProfileData = useCallback(async (userId) => {
        const [skillsData, habitsData, questsData] = await Promise.all([
            db.getSkills(userId),
            db.getHabits(userId),
            db.getQuests(userId),
        ]);

        // Skills — map snake_case → camelCase for SkillRadarChart
        setSkills(skillsData.map(s => ({ ...s, currentXP: s.current_xp })));

        // Stats derived from fetched data — no extra requests
        const bestStreak = habitsData.reduce((max, h) => Math.max(max, h.longest_streak ?? h.streak ?? 0), 0);
        const questsCompleted = questsData.filter(q => q.completed).length;
        setStats({ habitsCount: habitsData.length, bestStreak, questsCompleted });
    }, []);

    // Compute achievement unlock state from real data — no extra fetches
    const achievements = useMemo(() => [
        {
            id: 1, title: 'First Steps', description: 'Created your first habit',
            unlocked: stats.habitsCount >= 1,
        },
        {
            id: 2, title: 'Week Warrior', description: 'Maintained a 7-day streak',
            unlocked: stats.bestStreak >= 7,
        },
        {
            id: 3, title: 'Quest Master', description: 'Completed 10 quests',
            unlocked: stats.questsCompleted >= 10,
        },
        {
            id: 4, title: 'Skill Seeker', description: 'Reached level 5 in any skill',
            unlocked: skills.some(s => (s.level ?? 1) >= 5),
        },
        {
            id: 5, title: 'Consistency King', description: 'Completed habits for 30 days straight',
            unlocked: stats.bestStreak >= 30,
        },
        {
            id: 6, title: 'XP Hunter', description: 'Earned 1,000 total XP',
            unlocked: (profile?.total_xp ?? 0) >= 1000,
        },
    ], [stats, skills, profile]);

    useEffect(() => {
        if (user) fetchProfileData(user.id);
    }, [user?.id, fetchProfileData]);

    const avatarUrl = profile?.avatar_url ?? null;
    const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Adventurer';
    const playerStats = useMemo(() => ({
        level: profile?.level ?? 1,
        currentXP: profile?.current_xp ?? 0,
        maxXP: profile?.next_level_xp ?? 100,
        totalXP: profile?.total_xp ?? 0,
    }), [profile]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); return; }
        setUploading(true);
        try {
            const filePath = `${user.id}/avatar`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true, contentType: file.type });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const urlWithBust = `${publicUrl}?t=${Date.now()}`;
            const { error: dbError } = await supabase
                .from('user_profiles')
                .update({ avatar_url: urlWithBust })
                .eq('id', user.id);
            if (dbError) console.warn('Could not save avatar URL:', dbError.message);
            // Update context so sidebar also reflects new avatar instantly
            updateAvatarUrl?.(urlWithBust);
        } catch (err) {
            console.error('Avatar upload failed:', err);
            const msg = err?.message || err?.error_description || JSON.stringify(err);
            alert(`Upload failed: ${msg}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };


    const username = displayName || user?.email?.split('@')[0] || 'Adventurer';

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-border" style={{ backgroundColor: 'var(--background)' }}>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
                        <p className="text-sm text-muted-foreground">Manage your account and view your progress</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="space-y-5">
                            {/* Avatar Card */}
                            <div className="bg-card border border-border rounded-xl p-6 text-center">
                                {/* Avatar with upload */}
                                <div className="relative w-24 h-24 mx-auto mb-4">
                                    <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/20">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                                <User className="w-12 h-12 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Camera button */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition shadow-lg"
                                        title="Upload profile photo"
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                                        ) : (
                                            <Camera className="w-4 h-4 text-primary-foreground" />
                                        )}
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                </div>
                                <h2 className="text-lg font-bold text-foreground mb-1">{username}</h2>
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-4">
                                    <Mail className="w-3 h-3" />
                                    {user?.email || 'user@example.com'}
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                                    <Trophy className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-xs font-semibold text-primary">Level {playerStats.level}</span>
                                </div>
                                {uploading && <p className="text-xs text-muted-foreground mt-2">Uploading photo...</p>}
                            </div>

                            {/* Quick Stats */}
                            <div className="bg-card border border-border rounded-xl p-5">
                                <h3 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-wide">Account Info</h3>
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

                            {/* Radar Chart */}
                            <SkillRadarChart skills={skills} />
                            
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-2 space-y-5">
                            {/* XP Progress */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h3 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-wide">Level Progress</h3>
                                <XPBar currentXP={playerStats.currentXP} maxXP={playerStats.maxXP} level={playerStats.level} />
                            </div>

                            {/* Stat Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Total XP', value: playerStats.totalXP.toLocaleString(), icon: Trophy, color: 'text-primary', bg: 'bg-primary/10' },
                                    { label: 'Habits Created', value: stats.habitsCount.toString(), icon: Target, color: 'text-chart-2', bg: 'bg-chart-2/10' },
                                    { label: 'Best Streak', value: `${stats.bestStreak}d`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                ].map(stat => {
                                    const Icon = stat.icon;
                                    return (
                                        <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
                                            <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                                                <Icon className={`w-4 h-4 ${stat.color}`} />
                                            </div>
                                            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                                            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Achievements */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h3 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-wide">Achievements</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {achievements.map(achievement => (
                                        <div
                                            key={achievement.id}
                                            className={`p-4 rounded-xl border transition ${
                                                achievement.unlocked
                                                    ? 'border-primary/30 bg-primary/5'
                                                    : 'border-border bg-muted/30 opacity-50'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${achievement.unlocked ? 'bg-primary/20' : 'bg-muted'}`}>
                                                    <Shield className={`w-4 h-4 ${achievement.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-foreground">{achievement.title}</h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
                                                    {achievement.unlocked && (
                                                        <span className="inline-block mt-1.5 text-xs text-primary font-medium">✓ Unlocked</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 flex items-center justify-between gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-foreground mb-1">Danger Zone</h4>
                                    <p className="text-xs text-muted-foreground">Irreversible actions that affect your account</p>
                                </div>
                                <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition text-sm font-medium flex-shrink-0">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;

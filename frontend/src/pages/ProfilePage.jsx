import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import * as db from '../lib/database';
import Navigation from '../components/Navigation';
import XPBar from '../components/XPBar';
import { User, Mail, Trophy, Target, Flame, LogOut, Shield, Camera, Loader2, Edit2, Check, X, Upload } from 'lucide-react';
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
    const { user, profile, updateAvatarUrl, updateDisplayName } = useUserProfile() ?? {};
    
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [updatingName, setUpdatingName] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);

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

    const handleAvatarClick = () => {
        setPreviewUrl(avatarUrl);
        setShowUploadModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB.'); return; }
        
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setSelectedFile(file);
    };

    const confirmUpload = async () => {
        if (!selectedFile || !user) return;
        
        setUploading(true);
        try {
            const filePath = `${user.id}/avatar`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, selectedFile, { upsert: true, contentType: selectedFile.type });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const urlWithBust = `${publicUrl}?t=${Date.now()}`;
            const { error: dbError } = await supabase
                .from('user_profiles')
                .update({ avatar_url: urlWithBust })
                .eq('id', user.id);
            if (dbError) console.warn('Could not save avatar URL:', dbError.message);
            updateAvatarUrl?.(urlWithBust);
            setShowUploadModal(false);
            setPreviewUrl(null);
            setSelectedFile(null);
        } catch (err) {
            console.error('Avatar upload failed:', err);
            const msg = err?.message || err?.error_description || JSON.stringify(err);
            alert(`Upload failed: ${msg}`);
        } finally {
            setUploading(false);
        }
    };

    const cancelUpload = () => {
        setShowUploadModal(false);
        setPreviewUrl(null);
        setSelectedFile(null);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const handleStartEdit = () => {
        setNewName(displayName);
        setIsEditingName(true);
    };

    const handleSaveName = async () => {
        if (!newName.trim() || newName === displayName) {
            setIsEditingName(false);
            return;
        }
        setUpdatingName(true);
        try {
            const { error } = await updateDisplayName(newName.trim());
            if (error) throw error;
            setIsEditingName(false);
        } catch (err) {
            console.error('Failed to update name:', err);
            alert('Failed to update display name');
        } finally {
            setUpdatingName(false);
        }
    };


    const username = displayName || user?.email?.split('@')[0] || 'Adventurer';

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-border" style={{ backgroundColor: 'var(--background)' }}>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">Profile</h1>
                        <p className="hidden md:block text-sm text-muted-foreground">Manage your account and view your progress</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border border-border rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground shadow-sm"
                    >
                        <LogOut className="w-3.5 md:w-4 h-3.5 md:h-4" />
                        Logout
                    </button>
                </div>

                <div className="px-4 py-6 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4 md:space-y-5">
                            {/* Avatar Card */}
                            <div className="bg-card border border-border rounded-xl p-5 md:p-6 text-center shadow-sm">
                                {/* Avatar with upload */}
                                <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-4">
                                    <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-primary/20 relative">
                                        {previewUrl ? (
                                            <>
                                                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                                                    <span className="bg-primary text-primary-foreground text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg uppercase tracking-wider">Preview</span>
                                                </div>
                                            </>
                                        ) : avatarUrl ? (
                                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                                                <User className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    {/* Camera button */}
                                    <button
                                        onClick={handleAvatarClick}
                                        disabled={uploading}
                                        className="absolute bottom-0 right-0 w-7 h-7 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center hover:opacity-90 transition shadow-lg"
                                        title="Change profile photo"
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-foreground animate-spin" />
                                        ) : (
                                            <Camera className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-foreground" />
                                        )}
                                    </button>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                </div>
                                
                                {isEditingName ? (
                                    <div className="flex items-center justify-center gap-2 mb-1 px-4">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full bg-background border border-primary/30 rounded px-2 py-1 text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-primary"
                                            autoFocus
                                            disabled={updatingName}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveName();
                                                if (e.key === 'Escape') setIsEditingName(false);
                                            }}
                                        />
                                        <button 
                                            onClick={handleSaveName}
                                            disabled={updatingName}
                                            className="p-1 hover:bg-primary/10 rounded-full text-primary transition-colors"
                                        >
                                            {updatingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        </button>
                                        <button 
                                            onClick={() => setIsEditingName(false)}
                                            disabled={updatingName}
                                            className="p-1 hover:bg-destructive/10 rounded-full text-destructive transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 mb-1 group relative">
                                        {/* Invisible spacer to perfectly center the text, matching the width of the edit button package */}
                                        <div className="w-8 invisible" aria-hidden="true" />
                                        <h2 className="text-xl font-black text-center text-foreground leading-tight">{username}</h2>
                                        <button 
                                            onClick={handleStartEdit}
                                            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 rounded-lg text-muted-foreground hover:text-primary"
                                            title="Edit name"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <p className="text-[10px] md:text-xs text-muted-foreground flex items-center justify-center gap-1 mb-4">
                                    <Mail className="w-3 h-3" />
                                    {user?.email || 'user@example.com'}
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                    <Trophy className="w-3 h-3 text-primary" />
                                    <span className="text-[10px] md:text-xs font-bold text-primary">Level {playerStats.level}</span>
                                </div>
                                {uploading && <p className="text-[10px] text-muted-foreground mt-2 animate-pulse">Uploading...</p>}
                            </div>

                            {/* Quick Stats */}
                            <div className="bg-card border border-border rounded-xl p-4 md:p-5 shadow-sm">
                                <h3 className="text-[10px] md:text-xs font-semibold text-foreground mb-3 uppercase tracking-wide">Account</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-medium">Joined</span>
                                        <span className="font-bold text-foreground">
                                            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Jan 2026'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-medium">Last Login</span>
                                        <span className="font-bold text-foreground">Today</span>
                                    </div>
                                </div>
                            </div>

                            {/* Radar Chart */}
                            <div className="bg-card border border-border rounded-xl p-2 md:p-4 shadow-sm overflow-hidden">
                                <SkillRadarChart skills={skills} />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="lg:col-span-2 space-y-4 md:space-y-5">
                            {/* XP Progress */}
                            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
                                <h3 className="text-[10px] md:text-xs font-semibold text-foreground mb-4 uppercase tracking-wide">Progress</h3>
                                <XPBar currentXP={playerStats.currentXP} maxXP={playerStats.maxXP} level={playerStats.level} />
                            </div>

                            {/* Stat Cards */}
                            <div className="grid grid-cols-3 gap-3 md:gap-4">
                                {[
                                    { label: 'Total XP', value: playerStats.totalXP.toLocaleString(), icon: Trophy, color: 'text-primary', bg: 'bg-primary/10' },
                                    { label: 'Habits', value: stats.habitsCount.toString(), icon: Target, color: 'text-chart-2', bg: 'bg-chart-2/10' },
                                    { label: 'Streak', value: `${stats.bestStreak}d`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                                ].map(stat => {
                                    const Icon = stat.icon;
                                    return (
                                        <div key={stat.label} className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm text-center md:text-left">
                                            <div className={`w-8 h-8 md:w-9 md:h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-2 md:mb-3 mx-auto md:mx-0`}>
                                                <Icon className={`w-4 h-4 ${stat.color}`} />
                                            </div>
                                            <div className="text-base md:text-2xl font-bold text-foreground">{stat.value}</div>
                                            <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 font-medium">{stat.label}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Achievements */}
                            <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-sm">
                                <h3 className="text-[10px] md:text-xs font-semibold text-foreground mb-4 uppercase tracking-wide">Achievements</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {achievements.map(achievement => (
                                        <div
                                            key={achievement.id}
                                            className={`p-3 md:p-4 rounded-xl border transition-all ${
                                                achievement.unlocked
                                                    ? 'border-primary/30 bg-primary/5'
                                                    : 'border-border bg-muted/30 opacity-50'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${achievement.unlocked ? 'bg-primary/20' : 'bg-muted'}`}>
                                                    <Shield className={`w-3.5 h-3.5 md:w-4 md:h-4 ${achievement.unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xs md:text-sm font-bold text-foreground leading-tight">{achievement.title}</h4>
                                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 leading-relaxed">{achievement.description}</p>
                                                    {achievement.unlocked && (
                                                        <span className="inline-flex items-center mt-1.5 text-[10px] text-primary font-bold uppercase tracking-wider">
                                                           Unlocked
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 md:p-5 hstack justify-between sm:flex-row flex-col gap-4">
                                <div>
                                    <h4 className="text-xs md:text-sm font-bold text-foreground mb-1 leading-tight">Danger Zone</h4>
                                    <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">Irreversible actions that affect your account</p>
                                </div>
                                <button className="w-full sm:w-auto px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition text-xs md:text-sm font-bold shadow-md">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Image Preview Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={cancelUpload}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10"
                        >
                            <div className="p-6 text-center">
                                <h3 className="text-xl font-black text-foreground mb-1">
                                    {selectedFile ? 'Preview New Avatar' : 'Update Avatar'}
                                </h3>
                                <p className="text-xs text-muted-foreground mb-6">
                                    {selectedFile ? 'Looking good!' : 'Click upload to select an image'}
                                </p>

                                <div className="relative w-48 h-48 mx-auto mb-8">
                                    <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-primary/30 shadow-2xl bg-muted shrink-0">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-20 h-20 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {!selectedFile ? (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                        >
                                            <Upload className="w-4 h-4" />
                                            Upload Image
                                        </button>
                                    ) : (
                                        <button
                                            onClick={confirmUpload}
                                            disabled={uploading}
                                            className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                                        >
                                            {uploading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Confirm
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={cancelUpload}
                                        disabled={uploading}
                                        className="w-full px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-bold hover:bg-muted transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePage;

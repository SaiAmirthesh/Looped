import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import * as db from '../lib/database';
import { useUserProfile } from '../context/UserProfileContext';
import Navigation from '../components/Navigation';
import QuestCard from '../components/QuestCard';
import { Sword, CheckCircle, X, Plus, Trophy } from 'lucide-react';

const SKILLS = ['Focus', 'Learning', 'Health', 'Creativity', 'Confidence', 'Social'];

const QuestsPage = () => {
    const navigate = useNavigate();
    const { refreshProfile, applyXpToProfile } = useUserProfile() ?? {};
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [showModal, setShowModal] = useState(false);
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newQuest, setNewQuest] = useState({ title: '', description: '', xpReward: 100, difficulty: 'Easy', skill: 'Focus' });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }
            setUser(session.user);
            await fetchQuests(session.user.id);
        };
        checkUser();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) navigate('/login');
            else {
                setUser(session.user);
                fetchQuests(session.user.id);
            }
        });
        return () => subscription?.unsubscribe();
    }, [navigate]);

    const fetchQuests = async (userId) => {
        if (!userId) return;
        setLoading(true);
        const questsData = await db.getQuests(userId);
        setQuests(questsData);
        setLoading(false);
    };

    const handleAddQuest = async (e) => {
        e.preventDefault();
        if (!newQuest.title.trim() || !user) return;
        
        setLoading(true);
        const createdQuest = await db.createQuest(user.id, {
            title: newQuest.title,
            description: newQuest.description,
            difficulty: newQuest.difficulty,
            skill: newQuest.skill,
            xpReward: parseInt(newQuest.xpReward),
        });
        
        if (createdQuest) {
            setQuests([createdQuest, ...quests]);
            setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Easy', skill: 'Focus' });
            setShowModal(false);
        }
        setLoading(false);
    };

    const handleToggleQuest = async (id) => {
        if (!user) return;
        
        setLoading(true);
        const result = await db.completeQuest(id, user.id);
        
        if (result.success && !result.alreadyDone) {
            // Instantly update XP bar — no re-fetch race
            applyXpToProfile?.(result.xpAwarded ?? 0);
            // Refresh quest list from DB
            await fetchQuests(user.id);
        } else if (result.success) {
            await fetchQuests(user.id);
        }
        setLoading(false);
    };

    const handleDeleteQuest = async (id) => {
        if (!window.confirm('Delete this quest?')) return;
        
        setLoading(true);
        const success = await db.deleteQuest(id);
        
        if (success) {
            setQuests(quests.filter(q => q.id !== id));
        }
        setLoading(false);
    };

    const activeQuests = quests.filter(q => !q.completed);
    const completedQuests = quests.filter(q => q.completed);
    const totalXPEarned = completedQuests.reduce((sum, q) => sum + q.xp_reward, 0);
    const totalXPAvailable = activeQuests.reduce((sum, q) => sum + q.xp_reward, 0);

    const displayedQuests = activeTab === 'active' ? activeQuests : completedQuests;

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-border" style={{ backgroundColor: 'var(--background)' }}>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">Quests</h1>
                        <p className="hidden md:block text-sm text-muted-foreground">Manage your objectives and growth</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-xs md:text-sm font-semibold shadow-sm"
                    >
                        <Plus className="w-3.5 md:w-4 h-3.5 md:h-4" />
                        <span>New Quest</span>
                    </button>
                </div>

                <div className="px-4 py-6 md:p-8 space-y-5 md:space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                                <Sword className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span className="text-[10px] md:text-xs uppercase tracking-wider font-bold">Active</span>
                            </div>
                            <div className="text-xl md:text-3xl font-bold text-foreground">{activeQuests.length}</div>
                            <div className="hidden md:block text-xs text-muted-foreground mt-1">ongoing quests</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1 text-primary">
                                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span className="text-[10px] md:text-xs uppercase tracking-wider font-bold">Done</span>
                            </div>
                            <div className="text-xl md:text-3xl font-bold text-foreground">{completedQuests.length}</div>
                            <div className="hidden md:block text-xs text-muted-foreground mt-1">completed</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1 text-yellow-500">
                                <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span className="text-[10px] md:text-xs uppercase tracking-wider font-bold">XP</span>
                            </div>
                            <div className="text-xl md:text-3xl font-bold text-foreground">{totalXPEarned}</div>
                            <div className="hidden md:block text-xs text-muted-foreground mt-1">{totalXPAvailable} XP available</div>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                        {[
                            { key: 'active', label: `Active (${activeQuests.length})` },
                            { key: 'completed', label: `Completed (${completedQuests.length})` },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-semibold transition-all ${
                                    activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Quest Grid */}
                    {displayedQuests.length === 0 ? (
                        <div className="max-w-md mx-auto mt-8 md:mt-12 bg-card border border-dashed border-border rounded-2xl p-8 md:p-12 text-center shadow-inner">
                            <Sword className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                            <h2 className="text-lg md:text-xl font-bold text-foreground mb-3">
                                {activeTab === 'active' ? 'No active quests' : 'No completed quests yet'}
                            </h2>
                            <p className="text-sm text-muted-foreground mb-8">
                                {activeTab === 'active' ? 'Create a quest to start your journey.' : 'Complete quests to see them here.'}
                            </p>
                            {activeTab === 'active' && (
                                <button onClick={() => setShowModal(true)} 
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition shadow-lg">
                                    <Plus className="w-5 h-5" />
                                    Add First Quest
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {displayedQuests.map(quest => (
                                <QuestCard
                                    key={quest.id}
                                    title={quest.title}
                                    description={quest.description}
                                    xpReward={quest.xp_reward}
                                    difficulty={quest.difficulty.toLowerCase()}
                                    skill={quest.skill}
                                    completed={quest.completed}
                                    onToggle={() => handleToggleQuest(quest.id)}
                                    onDelete={() => handleDeleteQuest(quest.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>


            {/* Add Quest Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-foreground">New Quest</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddQuest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Quest Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Read 10 pages daily"
                                    value={newQuest.title}
                                    onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                                <textarea
                                    placeholder="Describe your quest..."
                                    value={newQuest.description}
                                    onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Difficulty</label>
                                    <select
                                        value={newQuest.difficulty}
                                        onChange={(e) => setNewQuest({ ...newQuest, difficulty: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">XP Reward</label>
                                    <input
                                        type="number"
                                        min="10"
                                        max="1000"
                                        value={newQuest.xpReward}
                                        onChange={(e) => setNewQuest({ ...newQuest, xpReward: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Skill to Train</label>
                                <select
                                    value={newQuest.skill}
                                    onChange={(e) => setNewQuest({ ...newQuest, skill: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                                >
                                    {SKILLS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground mt-1">XP will be added to this skill on completion</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition">
                                    Create Quest
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestsPage;

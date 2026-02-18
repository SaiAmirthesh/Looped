import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import QuestCard from '../components/QuestCard';
import { Sword, CheckCircle, X, Plus, Trophy } from 'lucide-react';

const QuestsPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [showModal, setShowModal] = useState(false);
    const [quests, setQuests] = useState([]);
    const [newQuest, setNewQuest] = useState({ title: '', description: '', xpReward: 100, difficulty: 'easy', skill: 'Focus' });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }
            setUser(session.user);
        };
        checkUser();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) navigate('/login');
            else setUser(session.user);
        });
        return () => subscription?.unsubscribe();
    }, [navigate]);

    const handleAddQuest = (e) => {
        e.preventDefault();
        if (!newQuest.title.trim()) return;
        const quest = {
            id: crypto.randomUUID(),
            title: newQuest.title,
            description: newQuest.description,
            xpReward: parseInt(newQuest.xpReward),
            difficulty: newQuest.difficulty,
            skill: newQuest.skill,
            progress: 0,
            total: 1,
            completed: false,
            createdAt: new Date().toISOString()
        };
        setQuests([...quests, quest]);
        setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'easy', skill: 'Focus' });
        setShowModal(false);
    };

    const handleToggleQuest = (id) => {
        setQuests(quests.map(quest =>
            quest.id === id ? { ...quest, completed: !quest.completed, completedDate: !quest.completed ? new Date().toISOString().split('T')[0] : null } : quest
        ));
    };

    const handleDeleteQuest = (id) => {
        if (window.confirm('Delete this quest?')) setQuests(quests.filter(q => q.id !== id));
    };

    const activeQuests = quests.filter(q => !q.completed);
    const completedQuests = quests.filter(q => q.completed);
    const totalXPEarned = completedQuests.reduce((sum, q) => sum + q.xpReward, 0);
    const totalXPAvailable = activeQuests.reduce((sum, q) => sum + q.xpReward, 0);

    const displayedQuests = activeTab === 'active' ? activeQuests : completedQuests;

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-border" style={{ backgroundColor: 'var(--background)' }}>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Quest Board</h1>
                        <p className="text-sm text-muted-foreground">Manage your objectives and track your growth</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New Quest
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <Sword className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Active</span>
                            </div>
                            <div className="text-3xl font-bold text-foreground">{activeQuests.length}</div>
                            <div className="text-xs text-muted-foreground mt-1">quests in progress</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-4 h-4 text-primary" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Completed</span>
                            </div>
                            <div className="text-3xl font-bold text-foreground">{completedQuests.length}</div>
                            <div className="text-xs text-muted-foreground mt-1">quests done</div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-1">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">XP Earned</span>
                            </div>
                            <div className="text-3xl font-bold text-foreground">{totalXPEarned}</div>
                            <div className="text-xs text-muted-foreground mt-1">{totalXPAvailable} XP available</div>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
                        {[
                            { key: 'active', label: `Active (${activeQuests.length})` },
                            { key: 'completed', label: `Completed (${completedQuests.length})` },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                                    activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Quest Grid */}
                    {displayedQuests.length === 0 ? (
                        <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
                            <Sword className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-foreground font-medium mb-1">
                                {activeTab === 'active' ? 'No active quests' : 'No completed quests yet'}
                            </p>
                            <p className="text-sm text-muted-foreground mb-4">
                                {activeTab === 'active' ? 'Create a quest to start your journey.' : 'Complete quests to see them here.'}
                            </p>
                            {activeTab === 'active' && (
                                <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition">
                                    + Add First Quest
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
                                    xpReward={quest.xpReward}
                                    difficulty={quest.difficulty}
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
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
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

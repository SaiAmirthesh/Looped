import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import QuestCard from '../components/QuestCard';
import { Sword, CheckCircle, X, Plus } from 'lucide-react';
import { getUserQuests, createQuest, deleteQuest, completeQuest, subscribeToQuests } from '../lib/supabaseAPI';
import { usePageVisibilityRefetch } from '../lib/usePageVisibilityRefetch';
import { useDebouncedCallback } from '../lib/useDebouncedCallback';

const QuestsPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(false); // Start false for faster initial render
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // This was not in the provided snippet, but was in the original code. Keeping it.

    const [newQuest, setNewQuest] = useState({
        title: '',
        description: '',
        xpReward: 100,
        difficulty: 'Easy',
        skill: 'Focus'
    });

    const loadQuests = useCallback(async () => {
        try {
            setLoading(true);
            const questsData = await getUserQuests();
            setQuests(questsData);
        } catch (error) {
            console.error('Error loading quests:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedRefetch = useDebouncedCallback(loadQuests, 300);

    useEffect(() => {
        let questsSubscription;

        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            setUser(session.user);
            loadQuests();

            // Subscribe to real-time quest changes
            questsSubscription = await subscribeToQuests(debouncedRefetch);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
                loadQuests();
            }
        });

        return () => {
            subscription?.unsubscribe();
            questsSubscription?.unsubscribe();
        };
    }, [navigate, loadQuests, debouncedRefetch]);

    usePageVisibilityRefetch(debouncedRefetch);

    const handleAddQuest = async (e) => {
        e.preventDefault();

        // Optimistic UI update - add immediately
        const tempId = `temp-${Date.now()}`;
        const optimisticQuest = {
            id: tempId,
            title: newQuest.title,
            description: newQuest.description,
            difficulty: newQuest.difficulty,
            skill: newQuest.skill,
            xpReward: parseInt(newQuest.xpReward),
            completed: false,
            completedAt: null
        };

        setQuests(prev => [optimisticQuest, ...prev]);
        setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'Easy', skill: 'Focus' });
        setShowModal(false);

        try {
            const created = await createQuest({
                title: optimisticQuest.title,
                description: optimisticQuest.description,
                difficulty: optimisticQuest.difficulty,
                skill: optimisticQuest.skill,
                xpReward: optimisticQuest.xpReward
            });

            // Replace temp with real data - map all fields properly
            setQuests(prev => prev.map(q => q.id === tempId ? {
                id: created.id,
                title: created.title,
                description: created.description,
                difficulty: created.difficulty,
                skill: created.skill,
                xpReward: created.xp_reward,
                completed: created.completed,
                completedAt: created.completed_at
            } : q));
        } catch (error) {
            console.error('Error creating quest:', error);
            setQuests(prev => prev.filter(q => q.id !== tempId));
            alert('Failed to create quest. Please try again.');
        }
    };

    const handleToggleQuest = async (id) => {
        // Optimistic UI update
        setQuests(prev => prev.map(q =>
            q.id === id ? { ...q, completed: !q.completed } : q
        ));

        try {
            await completeQuest(id);
            const updated = await getUserQuests();
            setQuests(updated);
        } catch (error) {
            console.error('Error completing quest:', error);
            setQuests(prev => prev.map(q =>
                q.id === id ? { ...q, completed: !q.completed } : q
            ));
            alert('Failed to update quest. Please try again.');
        }
    };

    const handleDeleteQuest = async (id) => {
        if (!window.confirm('Are you sure you want to delete this quest?')) return;

        const questToDelete = quests.find(q => q.id === id);
        setQuests(prev => prev.filter(q => q.id !== id));

        try {
            await deleteQuest(id);
        } catch (error) {
            console.error('Error deleting quest:', error);
            if (questToDelete) {
                setQuests(prev => [questToDelete, ...prev]);
            }
            alert('Failed to delete quest. Please try again.');
        }
    };

    const activeQuests = quests.filter(q => !q.completed);
    const completedQuests = quests.filter(q => q.completed);
    const totalXPEarned = completedQuests.reduce((sum, quest) => sum + quest.xpReward, 0);
    const totalXPAvailable = activeQuests.reduce((sum, quest) => sum + quest.xpReward, 0);

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 ml-10 p-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-foreground">Quests</h1>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
                        >
                            <Plus className="w-5 h-5" />
                            Add Quest
                        </button>
                    </div>
                    <p className="text-muted-foreground">
                        Complete quests to earn XP and level up your skills
                    </p>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading your quests...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sword className="w-5 h-5 text-primary" />
                                    <span className="text-muted-foreground text-sm">Active Quests</span>
                                </div>
                                <div className="text-3xl font-bold text-foreground">{activeQuests.length}</div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-muted-foreground text-sm">Completed</span>
                                </div>
                                <div className="text-3xl font-bold text-foreground">{completedQuests.length}</div>
                            </div>

                            <div className="bg-card border border-border rounded-lg p-6">
                                <div className="text-muted-foreground text-sm mb-2">Total XP Earned</div>
                                <div className="text-3xl font-bold text-foreground">{totalXPEarned}</div>
                                <div className="text-sm text-muted-foreground mt-1">+{totalXPAvailable} available</div>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`px-6 py-2 rounded-md font-medium transition ${activeTab === 'active'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card border border-border hover:bg-muted'
                                    }`}
                            >
                                Active Quests ({activeQuests.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('completed')}
                                className={`px-6 py-2 rounded-md font-medium transition ${activeTab === 'completed'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card border border-border hover:bg-muted'
                                    }`}
                            >
                                Completed ({completedQuests.length})
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {activeTab === 'active'
                                ? activeQuests.map(quest => (
                                    <QuestCard
                                        key={quest.id}
                                        title={quest.title}
                                        description={quest.description}
                                        xpReward={quest.xpReward}
                                        difficulty={quest.difficulty}
                                        onToggle={() => handleToggleQuest(quest.id)}
                                        onDelete={() => handleDeleteQuest(quest.id)}
                                    />
                                ))
                                : completedQuests.map(quest => (
                                    <QuestCard
                                        key={quest.id}
                                        title={quest.title}
                                        description={quest.description}
                                        xpReward={quest.xpReward}
                                        difficulty={quest.difficulty}
                                        completed={true}
                                    />
                                ))
                            }
                        </div>

                        {showModal && (
                            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold text-foreground">Add New Quest</h2>
                                        <button
                                            onClick={() => setShowModal(false)}
                                            className="p-2 hover:bg-muted rounded-lg transition"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleAddQuest} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Quest Title
                                            </label>
                                            <input
                                                type="text"
                                                value={newQuest.title}
                                                onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                                placeholder="Enter quest title"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                value={newQuest.description}
                                                onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                                rows="3"
                                                placeholder="Describe your quest"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                XP Reward
                                            </label>
                                            <input
                                                type="number"
                                                value={newQuest.xpReward}
                                                onChange={(e) => setNewQuest({ ...newQuest, xpReward: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                                min="10"
                                                step="10"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Skill
                                            </label>
                                            <select
                                                value={newQuest.skill}
                                                onChange={(e) => setNewQuest({ ...newQuest, skill: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                            >
                                                <option value="Focus">Focus</option>
                                                <option value="Learning">Learning</option>
                                                <option value="Health">Health</option>
                                                <option value="Creativity">Creativity</option>
                                                <option value="Confidence">Confidence</option>
                                                <option value="Social">Social</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Difficulty
                                            </label>
                                            <select
                                                value={newQuest.difficulty}
                                                onChange={(e) => setNewQuest({ ...newQuest, difficulty: e.target.value })}
                                                className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                            >
                                                <option value="Easy">Easy</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Hard">Hard</option>
                                            </select>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowModal(false)}
                                                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
                                            >
                                                Add Quest
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default QuestsPage;

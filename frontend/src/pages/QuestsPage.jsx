import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import QuestCard from '../components/QuestCard';
import { Dialog } from '../components/ui/Dialog';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageTransition } from '../components/ui/PageTransition';
import * as Tabs from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { Sword, CheckCircle, Plus } from 'lucide-react';
import { getUserQuests, createQuest, deleteQuest, completeQuest, subscribeToQuests, getCachedQuests } from '../lib/supabaseAPI';
import { usePageVisibilityRefetch } from '../lib/usePageVisibilityRefetch';
import { useDebouncedCallback } from '../lib/useDebouncedCallback';

const QuestsPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [quests, setQuests] = useState(getCachedQuests() || []);
    const [loading, setLoading] = useState(!getCachedQuests()); // Start true for correct initial render if no cache
    const [showModal, setShowModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // This was not in the provided snippet, but was in the original code. Keeping it.

    const [newQuest, setNewQuest] = useState({
        title: '',
        description: '',
        xpReward: 100,
        difficulty: 'Easy',
        skill: 'Focus'
    });

    const loadQuests = useCallback(async () => {
        try {
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
            toast.success('Quest added!');
        } catch (error) {
            console.error('Error creating quest:', error);
            setQuests(prev => prev.filter(q => q.id !== tempId));
            toast.error('Failed to create quest. Please try again.');
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
            toast.error('Failed to update quest. Please try again.');
        }
    };

    const handleDeleteQuest = (id) => setDeleteTarget(id);

    const confirmDeleteQuest = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget;
        const questToDelete = quests.find(q => q.id === id);
        setQuests(prev => prev.filter(q => q.id !== id));
        setDeleteTarget(null);
        try {
            await deleteQuest(id);
            toast.success('Quest deleted');
        } catch (error) {
            console.error('Error deleting quest:', error);
            if (questToDelete) setQuests(prev => [questToDelete, ...prev]);
            toast.error('Failed to delete quest.');
        }
    };

    const activeQuests = quests.filter(q => !q.completed);
    const completedQuests = quests.filter(q => q.completed);
    const totalXPEarned = completedQuests.reduce((sum, quest) => sum + quest.xpReward, 0);
    const totalXPAvailable = activeQuests.reduce((sum, quest) => sum + quest.xpReward, 0);

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
                <PageTransition>
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-3xl font-bold text-foreground">Quests</h1>
                            <motion.button
                                onClick={() => setShowModal(true)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
                            >
                                <Plus className="w-5 h-5" />
                                Add Quest
                            </motion.button>
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

                            <Tabs.Root defaultValue="active" className="w-full">
                                <Tabs.List className="flex gap-2 mb-6 p-1 bg-muted/50 rounded-lg w-fit">
                                    <Tabs.Trigger value="active" className="px-6 py-2 rounded-md font-medium transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-muted">
                                        Active Quests ({activeQuests.length})
                                    </Tabs.Trigger>
                                    <Tabs.Trigger value="completed" className="px-6 py-2 rounded-md font-medium transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-muted">
                                        Completed ({completedQuests.length})
                                    </Tabs.Trigger>
                                </Tabs.List>

                                <Tabs.Content value="active" className="mt-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {activeQuests.map((quest, i) => (
                                            <QuestCard
                                                key={quest.id}
                                                index={i}
                                                title={quest.title}
                                                description={quest.description}
                                                xpReward={quest.xpReward}
                                                difficulty={quest.difficulty?.toLowerCase?.() || quest.difficulty}
                                                onToggle={() => handleToggleQuest(quest.id)}
                                                onDelete={() => handleDeleteQuest(quest.id)}
                                            />
                                        ))}
                                    </div>
                                </Tabs.Content>
                                <Tabs.Content value="completed" className="mt-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {completedQuests.map((quest, i) => (
                                            <QuestCard
                                                key={quest.id}
                                                index={i}
                                                title={quest.title}
                                                description={quest.description}
                                                xpReward={quest.xpReward}
                                                difficulty={quest.difficulty?.toLowerCase?.() || quest.difficulty}
                                                completed={true}
                                            />
                                        ))}
                                    </div>
                                </Tabs.Content>
                            </Tabs.Root>

                            <Dialog open={showModal} onOpenChange={setShowModal} title="Add New Quest">
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
                            </Dialog>

                            <ConfirmDialog
                                open={!!deleteTarget}
                                onOpenChange={(open) => !open && setDeleteTarget(null)}
                                title="Delete quest?"
                                description="This action cannot be undone."
                                confirmText="Delete"
                                cancelText="Cancel"
                                variant="destructive"
                                onConfirm={() => confirmDeleteQuest()}
                            />
                        </>
                    )}
                </PageTransition>
            </main>
        </div>
    );
};

export default QuestsPage;

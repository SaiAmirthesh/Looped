import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Navigation from '../components/Navigation';
import QuestCard from '../components/QuestCard';
import { Sword, CheckCircle, X, Plus } from 'lucide-react';

const QuestsPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [showModal, setShowModal] = useState(false);
    const [quests, setQuests] = useState([]);

    const [newQuest, setNewQuest] = useState({
        title: '',
        description: '',
        xpReward: 100,
        difficulty: 'easy',
        skill: 'Focus'
    });

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            setUser(session.user);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login');
            } else {
                setUser(session.user);
            }
        });

        return () => subscription?.unsubscribe();
    }, [navigate]);

    const handleAddQuest = (e) => {
        e.preventDefault();
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
        setQuests(quests.map(quest => {
            if (quest.id === id) {
                return {
                    ...quest,
                    completed: !quest.completed,
                    completedDate: !quest.completed ? new Date().toISOString().split('T')[0] : null
                };
            }
            return quest;
        }));
    };

    const handleDeleteQuest = (id) => {
        if (window.confirm('Are you sure you want to delete this quest?')) {
            setQuests(quests.filter(quest => quest.id !== id));
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
                        ? activeQuests.length === 0
                            ? <p className="text-muted-foreground text-sm col-span-2">No active quests. Add one to get started!</p>
                            : activeQuests.map(quest => (
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
                        : completedQuests.length === 0
                            ? <p className="text-muted-foreground text-sm col-span-2">No completed quests yet.</p>
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
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
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
            </main>
        </div>
    );
};

export default QuestsPage;

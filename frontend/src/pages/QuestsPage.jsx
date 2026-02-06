import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import QuestCard from '../components/QuestCard';
import { Sword, CheckCircle, X, Plus } from 'lucide-react';

const QuestsPage = () => {
    const [activeTab, setActiveTab] = useState('active');
    const [showModal, setShowModal] = useState(false);
    const [quests, setQuests] = useState([
        {
            id: 1,
            title: 'Complete 7-day meditation streak',
            description: 'Meditate every day for a week to unlock inner peace and mental clarity',
            xpReward: 200,
            difficulty: 'medium',
            progress: 5,
            total: 7,
            completed: false
        },
        {
            id: 2,
            title: 'Read 3 books this month',
            description: 'Finish reading three complete books to expand your knowledge and perspective',
            xpReward: 500,
            difficulty: 'hard',
            progress: 1,
            total: 3,
            completed: false
        },
        {
            id: 3,
            title: 'Exercise 5 times this week',
            description: 'Complete 5 workout sessions to boost your health and energy levels',
            xpReward: 150,
            difficulty: 'easy',
            progress: 3,
            total: 5,
            completed: false
        },
        {
            id: 4,
            title: 'Learn a new skill',
            description: 'Spend 10 hours learning something new this month',
            xpReward: 300,
            difficulty: 'medium',
            progress: 4,
            total: 10,
            completed: false
        },
        {
            id: 5,
            title: 'Start your journey',
            description: 'Create your first habit and begin your adventure',
            xpReward: 50,
            difficulty: 'easy',
            completed: true,
            completedDate: '2026-01-15'
        },
        {
            id: 6,
            title: 'Early bird',
            description: 'Wake up before 7 AM for 3 consecutive days',
            xpReward: 100,
            difficulty: 'medium',
            completed: true,
            completedDate: '2026-01-20'
        },
    ]);

    const [newQuest, setNewQuest] = useState({
        title: '',
        description: '',
        xpReward: 100,
        difficulty: 'easy'
    });

    const activeQuests = quests.filter(q => !q.completed);
    const completedQuests = quests.filter(q => q.completed);

    const handleAddQuest = (e) => {
        e.preventDefault();
        const quest = {
            id: Date.now(),
            ...newQuest,
            xpReward: parseInt(newQuest.xpReward),
            progress: 0,
            total: 1,
            completed: false
        };
        setQuests([...quests, quest]);
        setNewQuest({ title: '', description: '', xpReward: 100, difficulty: 'easy' });
        setShowModal(false);
    };

    const handleToggleQuest = (id) => {
        setQuests(quests.map(quest =>
            quest.id === id
                ? { ...quest, completed: !quest.completed, completedDate: !quest.completed ? new Date().toISOString().split('T')[0] : null }
                : quest
        ));
    };

    const handleDeleteQuest = (id) => {
        if (window.confirm('Are you sure you want to delete this quest?')) {
            setQuests(quests.filter(quest => quest.id !== id));
        }
    };

    const totalXPEarned = completedQuests.reduce((sum, quest) => sum + quest.xpReward, 0);
    const totalXPAvailable = activeQuests.reduce((sum, quest) => sum + quest.xpReward, 0);

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 ml-10 p-8">
                {/* Header */}
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

                {/* Stats */}
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

                {/* Tabs */}
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

                {/* Quest Lists */}
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

                {/* Add Quest Modal */}
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

import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import QuestCard from '../components/QuestCard';
import { Sword, CheckCircle } from 'lucide-react';

const QuestsPage = () => {
    const [activeTab, setActiveTab] = useState('active');

    const activeQuests = [
        {
            id: 1,
            title: 'Complete 7-day meditation streak',
            description: 'Meditate every day for a week to unlock inner peace and mental clarity',
            xpReward: 200,
            difficulty: 'medium',
            progress: 5,
            total: 7
        },
        {
            id: 2,
            title: 'Read 3 books this month',
            description: 'Finish reading three complete books to expand your knowledge and perspective',
            xpReward: 500,
            difficulty: 'hard',
            progress: 1,
            total: 3
        },
        {
            id: 3,
            title: 'Exercise 5 times this week',
            description: 'Complete 5 workout sessions to boost your health and energy levels',
            xpReward: 150,
            difficulty: 'easy',
            progress: 3,
            total: 5
        },
        {
            id: 4,
            title: 'Learn a new skill',
            description: 'Spend 10 hours learning something new this month',
            xpReward: 300,
            difficulty: 'medium',
            progress: 4,
            total: 10
        },
    ];

    const completedQuests = [
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
        {
            id: 7,
            title: 'Consistency champion',
            description: 'Complete all daily habits for 5 days straight',
            xpReward: 250,
            difficulty: 'hard',
            completed: true,
            completedDate: '2026-02-01'
        },
    ];

    const totalXPEarned = completedQuests.reduce((sum, quest) => sum + quest.xpReward, 0);
    const totalXPAvailable = activeQuests.reduce((sum, quest) => sum + quest.xpReward, 0);

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Quests</h1>
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
                            <CheckCircle className="w-5 h-5 text-chart-2" />
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
                            <div key={quest.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                                <QuestCard
                                    title={quest.title}
                                    description={quest.description}
                                    xpReward={quest.xpReward}
                                    difficulty={quest.difficulty}
                                />
                                {/* Progress Bar */}
                                <div className="mt-4 pt-4 border-t border-border">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="text-foreground font-medium">{quest.progress} / {quest.total}</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all"
                                            style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                        : completedQuests.map(quest => (
                            <div key={quest.id} className="bg-card border border-border rounded-lg p-6 opacity-80">
                                <QuestCard
                                    title={quest.title}
                                    description={quest.description}
                                    xpReward={quest.xpReward}
                                    difficulty={quest.difficulty}
                                    completed={quest.completed}
                                />
                                <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                                    Completed on {new Date(quest.completedDate).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    }
                </div>
            </main>
        </div>
    );
};

export default QuestsPage;

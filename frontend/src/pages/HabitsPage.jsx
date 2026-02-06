import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import HabitCard from '../components/HabitCard';
import Modal from '../components/Modal';
import { Plus, Filter, TrendingUp } from 'lucide-react';

const HabitsPage = () => {
    const [habits, setHabits] = useState([
        { id: 1, title: 'Morning meditation', streak: 7, completed: true, category: 'Mindfulness' },
        { id: 2, title: 'Read for 30 minutes', streak: 3, completed: false, category: 'Learning' },
        { id: 3, title: 'Exercise', streak: 5, completed: true, category: 'Health' },
        { id: 4, title: 'Drink 8 glasses of water', streak: 12, completed: false, category: 'Health' },
        { id: 5, title: 'Journal before bed', streak: 2, completed: false, category: 'Mindfulness' },
    ]);

    const [showModal, setShowModal] = useState(false);
    const [newHabit, setNewHabit] = useState('');
    const [filter, setFilter] = useState('all');

    const handleAddHabit = () => {
        if (newHabit.trim()) {
            const habit = {
                id: Date.now(),
                title: newHabit,
                streak: 0,
                completed: false,
                category: 'General'
            };
            setHabits([...habits, habit]);
            setNewHabit('');
            setShowModal(false);
        }
    };

    const handleToggleHabit = (id) => {
        setHabits(habits.map(habit =>
            habit.id === id ? { ...habit, completed: !habit.completed } : habit
        ));
    };

    const filteredHabits = habits.filter(habit => {
        if (filter === 'completed') return habit.completed;
        if (filter === 'active') return !habit.completed;
        return true;
    });

    const completedCount = habits.filter(h => h.completed).length;

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Habits</h1>
                        <p className="text-muted-foreground">
                            {completedCount} of {habits.length} completed today
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
                    >
                        <Plus className="w-4 h-4" />
                        Add Habit
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground text-sm">Total Habits</span>
                            <TrendingUp className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{habits.length}</div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground text-sm">Longest Streak</span>
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                            {Math.max(...habits.map(h => h.streak))} days
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground text-sm">Completion Rate</span>
                            <span className="text-2xl">✓</span>
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                            {habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0}%
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md transition ${filter === 'all'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border hover:bg-muted'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-md transition ${filter === 'active'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border hover:bg-muted'
                            }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-md transition ${filter === 'completed'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border hover:bg-muted'
                            }`}
                    >
                        Completed
                    </button>
                </div>

                {/* Habits List */}
                <div className="space-y-3">
                    {filteredHabits.map(habit => (
                        <HabitCard
                            key={habit.id}
                            title={habit.title}
                            streak={habit.streak}
                            completed={habit.completed}
                            onToggle={() => handleToggleHabit(habit.id)}
                        />
                    ))}

                    {filteredHabits.length === 0 && (
                        <div className="text-center py-12 bg-card border border-border rounded-lg">
                            <p className="text-muted-foreground">No habits found</p>
                        </div>
                    )}
                </div>

                {/* Add Habit Modal */}
                {showModal && (
                    <Modal onClose={() => setShowModal(false)}>
                        <h2 className="text-2xl font-bold text-foreground mb-4">Add New Habit</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Habit Name
                                </label>
                                <input
                                    type="text"
                                    value={newHabit}
                                    onChange={(e) => setNewHabit(e.target.value)}
                                    placeholder="e.g., Morning run"
                                    className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleAddHabit}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
                                >
                                    Add Habit
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </main>
        </div>
    );
};

export default HabitsPage;

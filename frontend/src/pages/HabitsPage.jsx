import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import HabitCard from '../components/HabitCard';
import { Plus, X, Filter } from 'lucide-react';

const HabitsPage = () => {
    const [filter, setFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [habits, setHabits] = useState([
        { id: 1, name: 'Morning Meditation', streak: 7, completed: false, category: 'Wellness' },
        { id: 2, name: 'Read for 30 minutes', streak: 12, completed: true, category: 'Learning' },
        { id: 3, name: 'Exercise', streak: 5, completed: false, category: 'Health' },
        { id: 4, name: 'Drink 8 glasses of water', streak: 15, completed: true, category: 'Health' },
        { id: 5, name: 'Journal', streak: 3, completed: false, category: 'Wellness' },
        { id: 6, name: 'Code for 1 hour', streak: 20, completed: false, category: 'Learning' },
    ]);

    const [newHabit, setNewHabit] = useState({
        name: '',
        category: 'Wellness'
    });

    const handleAddHabit = (e) => {
        e.preventDefault();
        const habit = {
            id: Date.now(),
            ...newHabit,
            streak: 0,
            completed: false
        };
        setHabits([...habits, habit]);
        setNewHabit({ name: '', category: 'Wellness' });
        setShowModal(false);
    };

    const handleToggleHabit = (id) => {
        setHabits(habits.map(habit =>
            habit.id === id
                ? { ...habit, completed: !habit.completed, streak: !habit.completed ? habit.streak + 1 : habit.streak }
                : habit
        ));
    };

    const handleDeleteHabit = (id) => {
        if (window.confirm('Are you sure you want to delete this habit?')) {
            setHabits(habits.filter(habit => habit.id !== id));
        }
    };

    const filteredHabits = habits.filter(habit => {
        if (filter === 'active') return !habit.completed;
        if (filter === 'completed') return habit.completed;
        return true;
    });

    const totalHabits = habits.length;
    const completedToday = habits.filter(h => h.completed).length;
    const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

    return (
        <div className="flex min-h-screen bg-background">
            <Navigation />

            <main className="flex-1 ml-10 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Habits</h1>
                        <p className="text-muted-foreground">
                            Build consistency and track your daily progress
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
                    >
                        <Plus className="w-5 h-5" />
                        Add Habit
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground text-sm">Total Habits</span>
                            <span className="text-2xl">📋</span>
                        </div>
                        <div className="text-3xl font-bold text-foreground">{totalHabits}</div>
                        <div className="text-sm text-muted-foreground mt-1">Tracking daily</div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground text-sm">Completed Today</span>
                            <span className="text-2xl">✅</span>
                        </div>
                        <div className="text-3xl font-bold text-foreground">{completedToday}</div>
                        <div className="text-sm text-muted-foreground mt-1">Out of {totalHabits}</div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground text-sm">Longest Streak</span>
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div className="text-3xl font-bold text-foreground">{longestStreak}</div>
                        <div className="text-sm text-muted-foreground mt-1">Days in a row</div>
                    </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-3 mb-6">
                    <Filter className="w-5 h-5 text-muted-foreground" />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === 'all'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border hover:bg-muted'
                                }`}
                        >
                            All ({habits.length})
                        </button>
                        <button
                            onClick={() => setFilter('active')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === 'active'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border hover:bg-muted'
                                }`}
                        >
                            Active ({habits.filter(h => !h.completed).length})
                        </button>
                        <button
                            onClick={() => setFilter('completed')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === 'completed'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border hover:bg-muted'
                                }`}
                        >
                            Completed ({completedToday})
                        </button>
                    </div>
                </div>

                {/* Habits List */}
                <div className="space-y-3">
                    {filteredHabits.map(habit => (
                        <HabitCard
                            key={habit.id}
                            name={habit.name}
                            streak={habit.streak}
                            completed={habit.completed}
                            category={habit.category}
                            onToggle={() => handleToggleHabit(habit.id)}
                            onDelete={() => handleDeleteHabit(habit.id)}
                        />
                    ))}
                    {filteredHabits.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p className="text-lg mb-2">No habits found</p>
                            <p className="text-sm">Add a new habit to get started!</p>
                        </div>
                    )}
                </div>

                {/* Add Habit Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-foreground">Add New Habit</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-muted rounded-lg transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddHabit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Habit Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newHabit.name}
                                        onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        placeholder="e.g., Morning Meditation"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={newHabit.category}
                                        onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                                        className="w-full px-4 py-2 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="Wellness">Wellness</option>
                                        <option value="Health">Health</option>
                                        <option value="Learning">Learning</option>
                                        <option value="Productivity">Productivity</option>
                                        <option value="Social">Social</option>
                                        <option value="Other">Other</option>
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
                                        Add Habit
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

export default HabitsPage;

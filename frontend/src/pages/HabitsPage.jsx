import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Navigation from "../components/Navigation";
import HabitCard from "../components/HabitCard";
import { Plus, X, Filter, Flame } from "lucide-react";
import { getUserHabits, createHabit, deleteHabit, toggleHabitCompletion, subscribeToHabits } from "../lib/supabaseAPI";
import { usePageVisibilityRefetch } from "../lib/usePageVisibilityRefetch";
import { useDebouncedCallback } from "../lib/useDebouncedCallback";
import { SquareCheckBig, ListChecks } from "lucide-react";


const HabitsPage = () => {
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const habitsSubRef = useRef(null);

  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newHabit, setNewHabit] = useState({
    name: "",
    category: "Wellness",
    skill: "Focus",
  });

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      const habitsData = await getUserHabits();
      if (isMountedRef.current) {
        setHabits(habitsData);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const debouncedRefetch = useDebouncedCallback(loadHabits, 300);

  useEffect(() => {
    isMountedRef.current = true;

    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!isMountedRef.current) return;
      if (!session) {
        navigate("/login");
        return;
      }

      setUser(session.user);
      loadHabits();

      try {
        const sub = await subscribeToHabits(debouncedRefetch);
        if (!isMountedRef.current) {
          sub?.unsubscribe?.();
          return;
        }
        habitsSubRef.current = sub;
      } catch (err) {
        console.error('Error setting up habits subscription:', err);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      } else if (isMountedRef.current) {
        setUser(session.user);
        loadHabits();
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription?.unsubscribe();
      const sub = habitsSubRef.current;
      if (sub?.unsubscribe) {
        sub.unsubscribe();
      }
      habitsSubRef.current = null;
    };
  }, [navigate, loadHabits, debouncedRefetch]);

  usePageVisibilityRefetch(debouncedRefetch);

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;

    // Optimistic UI update - add immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticHabit = {
      id: tempId,
      name: newHabit.name,
      category: newHabit.category,
      skill: newHabit.skill,
      completedToday: false,
      streak: 0,
      longestStreak: 0,
      lastCompleted: null
    };

    setHabits(prev => [optimisticHabit, ...prev]);
    setNewHabit({ name: "", category: "Wellness", skill: "Focus" });
    setShowModal(false);

    try {
      // Save to database in background
      const created = await createHabit({
        name: optimisticHabit.name,
        category: optimisticHabit.category,
        skill: optimisticHabit.skill
      });

      // Replace temp with real data - map all fields properly
      setHabits(prev => prev.map(h => h.id === tempId ? {
        id: created.id,
        name: created.name,
        category: created.category,
        skill: created.skill,
        completedToday: created.completed_today,
        streak: created.streak,
        longestStreak: created.longest_streak,
        lastCompleted: created.last_completed
      } : h));
    } catch (error) {
      console.error('Error creating habit:', error);
      // Remove optimistic update on error
      setHabits(prev => prev.filter(h => h.id !== tempId));
      alert('Failed to create habit. Please try again.');
    }
  };

  const handleToggleHabit = async (id) => {
    // Optimistic UI update - toggle immediately
    setHabits(prev => prev.map(h =>
      h.id === id ? { ...h, completedToday: !h.completedToday } : h
    ));

    try {
      await toggleHabitCompletion(id);
      // Reload in background to get updated streak data
      const updated = await getUserHabits();
      setHabits(updated);
    } catch (error) {
      console.error('Error toggling habit:', error);
      // Revert on error
      setHabits(prev => prev.map(h =>
        h.id === id ? { ...h, completedToday: !h.completedToday } : h
      ));
      alert('Failed to update habit. Please try again.');
    }
  };

  const handleDeleteHabit = async (id) => {
    if (!window.confirm("Are you sure you want to delete this habit?")) return;

    // Store for potential rollback
    const habitToDelete = habits.find(h => h.id === id);

    // Optimistic UI update - remove immediately
    setHabits(prev => prev.filter(h => h.id !== id));

    try {
      await deleteHabit(id);
    } catch (error) {
      console.error('Error deleting habit:', error);
      // Restore on error
      if (habitToDelete) {
        setHabits(prev => [habitToDelete, ...prev]);
      }
      alert('Failed to delete habit. Please try again.');
    }
  };

  const filteredHabits = habits.filter((habit) => {
    if (filter === "active") return !habit.completedToday;
    if (filter === "completed") return habit.completedToday;
    return true;
  });

  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => h.completedToday).length;
  const longestStreak =
    habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;

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

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your habits...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">
                    Total Habits
                  </span>
                  <ListChecks size={28} color="#fbad04" strokeWidth={1.75} />
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {totalHabits}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Tracking daily
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">
                    Completed Today
                  </span>
                  <SquareCheckBig color="#05f020" />
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {completedToday}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Out of {totalHabits}
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground text-sm">
                    Longest Streak
                  </span>
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {longestStreak}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Days in a row
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-muted"
                    }`}
                >
                  All ({habits.length})
                </button>
                <button
                  onClick={() => setFilter("active")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === "active"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-muted"
                    }`}
                >
                  Active ({habits.filter((h) => !h.completedToday).length})
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${filter === "completed"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-muted"
                    }`}
                >
                  Completed ({completedToday})
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  name={habit.name}
                  streak={habit.streak}
                  completed={habit.completedToday}
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

            {showModal && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-foreground">
                      Add New Habit
                    </h2>
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
                        onChange={(e) =>
                          setNewHabit({ ...newHabit, name: e.target.value })
                        }
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
                        onChange={(e) =>
                          setNewHabit({ ...newHabit, category: e.target.value })
                        }
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

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Skill
                      </label>
                      <select
                        value={newHabit.skill}
                        onChange={(e) =>
                          setNewHabit({ ...newHabit, skill: e.target.value })
                        }
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
          </>
        )}
      </main>
    </div>
  );
};

export default HabitsPage;

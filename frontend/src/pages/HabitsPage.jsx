import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Navigation from "../components/Navigation";
import HabitCard from "../components/HabitCard";
import { Plus, X, Flame, CheckSquare, ListChecks, SquareCheckBig } from "lucide-react";

const HabitsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState({ name: "", category: "Wellness", skill: "Focus" });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
      else setUser(session.user);
    });
    return () => subscription?.unsubscribe();
  }, [navigate]);

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;
    const habit = {
      id: crypto.randomUUID(),
      title: newHabit.name,
      category: newHabit.category,
      skill: newHabit.skill,
      streak: 0,
      completedToday: false,
      lastCompleted: null,
      createdAt: new Date().toISOString(),
    };
    setHabits([...habits, habit]);
    setNewHabit({ name: "", category: "Wellness", skill: "Focus" });
    setShowModal(false);
  };

  const handleToggleHabit = (id) => {
    const today = new Date().toISOString().split("T")[0];
    setHabits(habits.map((habit) => {
      if (habit.id === id) {
        const completedToday = !habit.completedToday;
        if (completedToday) {
          const sameDay = habit.lastCompleted === today;
          return { ...habit, completedToday: true, lastCompleted: today, streak: sameDay ? habit.streak : habit.streak + 1 };
        }
        return { ...habit, completedToday: false };
      }
      return habit;
    }));
  };

  const handleDeleteHabit = (id) => {
    if (window.confirm("Delete this habit?")) setHabits(habits.filter((h) => h.id !== id));
  };

  const filteredHabits = habits.filter((h) => {
    if (filter === "active") return !h.completedToday;
    if (filter === "completed") return h.completedToday;
    return true;
  });

  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => h.completedToday).length;
  const longestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b border-border" style={{ backgroundColor: 'var(--background)' }}>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daily Habits</h1>
            <p className="text-sm text-muted-foreground">Track your habits, earn XP, and level up your skills</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Habit
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <ListChecks className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
              </div>
              <div className="text-3xl font-bold text-foreground">{totalHabits}</div>
              <div className="text-xs text-muted-foreground mt-1">habits created</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <SquareCheckBig className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Completed</span>
              </div>
              <div className="text-3xl font-bold text-foreground">{completedToday}</div>
              <div className="text-xs text-muted-foreground mt-1">done today</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Best Streak</span>
              </div>
              <div className="text-3xl font-bold text-foreground">{longestStreak}</div>
              <div className="text-xs text-muted-foreground mt-1">days</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
            {["all", "active", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition capitalize ${
                  filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Habits List */}
          <div className="space-y-3">
            {filteredHabits.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
                <CheckSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">No habits here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {filter === "all" ? "Create your first habit to start leveling up." : `No ${filter} habits right now.`}
                </p>
                {filter === "all" && (
                  <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition">
                    + Add First Habit
                  </button>
                )}
              </div>
            ) : (
              filteredHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  name={habit.title}
                  streak={habit.streak}
                  completed={habit.completedToday}
                  category={habit.category}
                  onToggle={() => handleToggleHabit(habit.id)}
                  onDelete={() => handleDeleteHabit(habit.id)}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add Habit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">New Habit</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Habit Name</label>
                <input
                  type="text"
                  placeholder="e.g. Morning meditation"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <select
                  value={newHabit.category}
                  onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  {["Wellness", "Productivity", "Learning", "Health", "Social", "Other"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Linked Skill</label>
                <select
                  value={newHabit.skill}
                  onChange={(e) => setNewHabit({ ...newHabit, skill: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                >
                  {["Focus", "Learning", "Health", "Creativity", "Confidence", "Social"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition">
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsPage;

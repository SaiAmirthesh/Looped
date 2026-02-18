import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import * as db from "../lib/database";
import { useUserProfile } from "../context/UserProfileContext";
import Navigation from "../components/Navigation";
import HabitCard from "../components/HabitCard";
import { Plus, X, Flame, CheckSquare, ListChecks, SquareCheckBig } from "lucide-react";

const HabitsPage = () => {
  const navigate = useNavigate();
  const { refreshProfile, applyXpToProfile } = useUserProfile() ?? {};
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", category: "Wellness", skill: "Focus" });

  // Auth check + fetch habits
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUser(session.user);
      await fetchHabits(session.user.id);
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
      else {
        setUser(session.user);
        fetchHabits(session.user.id);
      }
    });
    return () => subscription?.unsubscribe();
  }, [navigate]);

  const fetchHabits = async (userId) => {
    if (!userId) return;
    setLoading(true);
    const habitsData = await db.getHabits(userId);
    setHabits(habitsData);
    setLoading(false);
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabit.name.trim() || !user) return;
    
    setLoading(true);
    const createdHabit = await db.createHabit(user.id, {
      name: newHabit.name,
      category: newHabit.category,
      skill: newHabit.skill,
    });
    
    if (createdHabit) {
      setHabits([createdHabit, ...habits]);
      setNewHabit({ name: "", category: "Wellness", skill: "Focus" });
      setShowModal(false);
    }
    setLoading(false);
  };

  const handleToggleHabit = async (id) => {
    if (!user) return;
    
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    
    setLoading(true);
    let result;
    
    if (habit.completed_today) {
      // If already completed, uncomplete it
      result = await db.uncompleteHabit(id, user.id);
    } else {
      // If not completed, complete it
      result = await db.completeHabit(id, user.id, 10);
    }
    
    if (result.success) {
      applyXpToProfile?.(habit.completed_today ? -10 : 10); // instant XP bar update
      await fetchHabits(user.id);
    }
    setLoading(false);
  };

  const handleDeleteHabit = async (id) => {
    if (!window.confirm("Delete this habit?")) return;
    
    setLoading(true);
    const success = await db.deleteHabit(id);
    
    if (success) {
      setHabits(habits.filter((h) => h.id !== id));
    }
    setLoading(false);
  };

  const filteredHabits = habits.filter((h) => {
    if (filter === "active") return !h.completed_today;
    if (filter === "completed") return h.completed_today;
    return true;
  });

  const totalHabits = habits.length;
  const completedToday = habits.filter((h) => h.completed_today).length;
  const longestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.longest_streak)) : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-border" style={{ backgroundColor: 'var(--background)' }}>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">Habits</h1>
            <p className="hidden md:block text-sm text-muted-foreground">Track your habits and earn XP</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition text-xs md:text-sm font-semibold shadow-sm"
          >
            <Plus className="w-3.5 md:w-4 h-3.5 md:h-4" />
            <span>New Habit</span>
          </button>
        </div>

        <div className="px-4 py-6 md:p-8 space-y-5 md:space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                <ListChecks className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs uppercase tracking-wider font-bold">Total</span>
              </div>
              <div className="text-xl md:text-3xl font-bold text-foreground">{totalHabits}</div>
              <div className="hidden md:block text-xs text-muted-foreground mt-1">habits created</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1 text-primary">
                <SquareCheckBig className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs uppercase tracking-wider font-bold">Done</span>
              </div>
              <div className="text-xl md:text-3xl font-bold text-foreground">{completedToday}</div>
              <div className="hidden md:block text-xs text-muted-foreground mt-1">completed today</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 md:p-5 shadow-sm">
              <div className="flex items-center gap-1.5 mb-1 text-orange-500">
                <Flame className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs uppercase tracking-wider font-bold">Best</span>
              </div>
              <div className="text-xl md:text-3xl font-bold text-foreground">{longestStreak}</div>
              <div className="hidden md:block text-xs text-muted-foreground mt-1">day streak</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
            {["all", "active", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 md:px-4 py-1 md:py-1.5 rounded-md text-xs md:text-sm font-semibold transition-all capitalize ${
                  filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Habits List */}
          {filteredHabits.length === 0 ? (
            <div className="max-w-md mx-auto mt-8 md:mt-12 bg-card border border-dashed border-border rounded-2xl p-8 md:p-12 text-center shadow-inner">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckSquare className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-3">No habits here</h2>
              <p className="text-sm text-muted-foreground mb-8">
                {filter === "all" ? "Create your first habit to start leveling up." : `No ${filter} habits right now.`}
              </p>
              {filter === "all" && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Habit
                </button>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">
              {filteredHabits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  name={habit.name}
                  streak={habit.streak}
                  completed={habit.completed_today}
                  category={habit.category}
                  onToggle={() => handleToggleHabit(habit.id)}
                  onDelete={() => handleDeleteHabit(habit.id)}
                />
              ))}
            </div>
          )}
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

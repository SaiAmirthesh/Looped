import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Navigation from "../components/Navigation";
import HabitCard from "../components/HabitCard";
import { Plus, X, Filter, Flame } from "lucide-react";
import { getData, setData, generateKey } from "../lib/storage";
import { runMigrations } from "../lib/migrations";
import { SquareCheckBig,ListChecks } from "lucide-react";


const HabitsPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [habits, setHabits] = useState([]);

  const [newHabit, setNewHabit] = useState({
    name: "",
    category: "Wellness",
    skill: "Focus",
  });

  // Load user and habits from localStorage
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const userId = session.user.id;
      setUser(session.user);

      // Run migrations to fix old data
      runMigrations(userId);

      // Load habits for this user
      const storageKey = generateKey(userId, "habits");
      const savedHabits = getData(storageKey, []);

      // Reset completed status for new day
      const today = new Date().toISOString().split("T")[0];
      const resettedHabits = savedHabits.map((habit) => {
        if (habit.lastCompleted !== today && habit.completedToday) {
          return { ...habit, completedToday: false };
        }
        return habit;
      });

      setHabits(resettedHabits);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription?.unsubscribe();
  }, [navigate]);

  // Save habits to localStorage whenever they change
  useEffect(() => {
    if (user) {
      const storageKey = generateKey(user.id, "habits");
      setData(storageKey, habits);
    }
  }, [habits, user]);

  const addXP = (amount) => {
    if (!user) return;

    const xpKey = generateKey(user.id, "xp");
    const currentXP = getData(xpKey, {
      totalXP: 0,
      level: 1,
      currentXP: 0,
      nextLevelXP: 100,
    });

    // Always calculate nextLevelXP based on current level to ensure it's correct
    const currentNextLevelXP = Math.floor(100 * Math.pow(currentXP.level, 1.5));

    const newCurrentXP = currentXP.currentXP + amount;
    const xpForLevelUp = currentNextLevelXP;

    let newLevel = currentXP.level;
    let finalCurrentXP = newCurrentXP;
    let newNextLevelXP = currentNextLevelXP;

    // Handle level up with proper formula: nextLevelXP = 100 * (level ^ 1.5)
    if (newCurrentXP >= xpForLevelUp) {
      newLevel += 1;
      finalCurrentXP = newCurrentXP - xpForLevelUp;
      newNextLevelXP = Math.floor(100 * Math.pow(newLevel, 1.5));
    }

    const updatedXP = {
      totalXP: currentXP.totalXP + amount,
      level: newLevel,
      currentXP: finalCurrentXP,
      nextLevelXP: newNextLevelXP,
    };

    setData(xpKey, updatedXP);
  };

  const addSkillXP = (skillName, amount) => {
    if (!user) return;

    const skillsKey = generateKey(user.id, "skills");
    const defaultSkills = [
      { name: "Focus", currentXP: 0, level: 1 },
      { name: "Learning", currentXP: 0, level: 1 },
      { name: "Health", currentXP: 0, level: 1 },
      { name: "Creativity", currentXP: 0, level: 1 },
      { name: "Confidence", currentXP: 0, level: 1 },
      { name: "Social", currentXP: 0, level: 1 },
    ];
    let skills = getData(skillsKey, defaultSkills);

    // Add XP to the specified skill with leveling formula
    skills = skills.map((skill) => {
      if (skill.name === skillName) {
        const newXP = skill.currentXP + amount;
        const nextLevelXP = Math.floor(100 * Math.pow(skill.level, 1.5));
        const levelUp = newXP >= nextLevelXP;

        return {
          ...skill,
          currentXP: levelUp ? newXP - nextLevelXP : newXP,
          level: levelUp ? skill.level + 1 : skill.level,
        };
      }
      return skill;
    });

    setData(skillsKey, skills);
  };

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
    const updatedHabits = habits.map((habit) => {
      if (habit.id === id) {
        const completedToday = !habit.completedToday;
        if (completedToday) {
          const lastCompleted =
            habit.lastCompleted === today ? habit.lastCompleted : today;
          const sameDay = habit.lastCompleted === today;

          // Add XP to overall player XP
          addXP(10);

          // Add XP to the habit's associated skill (if it has one)
          if (habit.skill) {
            addSkillXP(habit.skill, 10);
          }

          return {
            ...habit,
            completedToday: true,
            lastCompleted: lastCompleted,
            streak: sameDay ? habit.streak : habit.streak + 1,
          };
        } else {
          return {
            ...habit,
            completedToday: false,
          };
        }
      }
      return habit;
    });
    setHabits(updatedHabits);
  };

  const handleDeleteHabit = (id) => {
    if (window.confirm("Are you sure you want to delete this habit?")) {
      setHabits(habits.filter((habit) => habit.id !== id));
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

        {/* Filter Buttons */}
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:bg-muted"
              }`}
            >
              All ({habits.length})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === "active"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:bg-muted"
              }`}
            >
              Active ({habits.filter((h) => !h.completed).length})
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                filter === "completed"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:bg-muted"
              }`}
            >
              Completed ({completedToday})
            </button>
          </div>
        </div>

        {/* Habits List */}
        <div className="space-y-3">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              name={habit.title}
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

        {/* Add Habit Modal */}
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
      </main>
    </div>
  );
};

export default HabitsPage;

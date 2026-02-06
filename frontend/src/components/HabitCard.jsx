export default function HabitCard({
  title = "New Habit",
  streak = 0,
  completed = false,
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-all
      ${
        completed
          ? "shadow-sm"
          : "shadow-sm hover:shadow-md"
      }`}
      style={{
        backgroundColor: completed ? "var(--muted)" : "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      {/* Left: Checkbox + Title */}
      <div className="flex items-center gap-3">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center`}
          style={{
            backgroundColor: completed ? "var(--accent)" : "transparent",
            borderColor: completed ? "var(--accent)" : "var(--border)",
            color: completed ? "var(--accent-foreground)" : "inherit",
          }}
        >
          {completed && "✓"}
        </div>

        <span
          className={`text-sm font-medium ${
            completed ? "line-through text-muted-foreground" : "text-foreground"
          }`}
        >
          {title}
        </span>
      </div>

      {/* Right: Streak */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>🔥</span>
        <span>{streak}</span>
      </div>
    </div>
  );
}

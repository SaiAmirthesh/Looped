import { Flame } from 'lucide-react';

export default function HabitCard({
  name = "New Habit",
  streak = 0,
  completed = false,
  category = "Other",
  onToggle,
  onDelete
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${completed
        ? "shadow-sm bg-muted/50"
        : "shadow-sm hover:shadow-md bg-card"
        }`}
      style={{
        borderColor: "var(--border)",
      }}
    >
      {/* Left: Checkbox + Title */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToggle}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${completed
            ? "bg-primary border-primary text-primary-foreground"
            : "border-border hover:border-primary"
            }`}
        >
          {completed && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <span
            className={`text-base font-medium ${completed ? "line-through text-muted-foreground" : "text-foreground"
              }`}
          >
            {name}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-md">
              {category}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Streak + Delete */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-sm">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-semibold text-foreground">{streak}</span>
          <span className="text-muted-foreground text-xs">days</span>
        </div>

        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
            title="Delete habit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

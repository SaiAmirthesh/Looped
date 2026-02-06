export default function QuestCard({
  title = "Quest Title",
  description = "Complete this quest to earn XP.",
  xpReward = 50,
  completed = false,
  difficulty = "easy", // easy | medium | hard
  progress = 0,
  onToggle,
  onDelete
}) {
  // Difficulty color mapping: easy = green, medium = orange, hard = red
  const difficultyStyles = {
    easy: {
      text: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/30"
    },
    medium: {
      text: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30"
    },
    hard: {
      text: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/30"
    }
  };

  const style = difficultyStyles[difficulty] || difficultyStyles.easy;

  return (
    <div
      className={`rounded-xl p-4 border transition-all ${completed
        ? "border-border opacity-70"
        : "shadow-sm hover:shadow-md border-border"
        }`}
      style={{
        backgroundColor: completed ? "var(--muted)" : "var(--card)",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-base font-semibold ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {title}
        </h3>

        <span className="text-sm font-medium text-primary">
          +{xpReward} XP
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3">
        {description}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm">
        <span className={`mt-4 px-2 py-1 rounded-md ${style.bg} ${style.text} ${style.border} border font-medium capitalize`}>
          {difficulty}
        </span>

        <div className="flex gap-2">
          {completed ? (
            <span className="text-green-500 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Completed
            </span>
          ) : (
            <>
              <button
                onClick={onToggle}
                className="mt-4 px-3 py-1.5 bg-accent text-accent-foreground rounded-md hover:opacity-90 font-medium transition"
              >
                Mark Complete
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="mt-4 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 font-medium transition"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

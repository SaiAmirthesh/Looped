export default function QuestCard({
  title = "Quest Title",
  description = "Complete this quest to earn XP.",
  xp = 50,
  completed = false,
  difficulty = "Easy", // Easy | Medium | Hard
}) {
  const difficultyColor = {
    Easy: "text-chart-1",
    Medium: "text-chart-4",
    Hard: "text-chart-2",
  };

  return (
    <div
      className={`rounded-xl p-4 border transition-all ${
        completed
          ? "border-border opacity-70"
          : "shadow-sm hover:shadow-md border-border"
      }`}
      style={{
        backgroundColor: completed ? "var(--muted)" : "var(--card)",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-base font-semibold text-foreground">
          {title}
        </h3>

        <span className="text-sm font-medium text-accent">
          +{xp} XP
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3">
        {description}
      </p>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm">
        <span className={difficultyColor[difficulty]}>
          {difficulty}
        </span>

        {completed ? (
          <span className="text-chart-1 font-medium">
            ✓ Completed
          </span>
        ) : (
          <button className="text-accent hover:opacity-80 font-medium">
            Mark as done
          </button>
        )}
      </div>
    </div>
  );
}

export default function XPBar({
  currentXP = 40,
  maxXP = 100,
  level = 1,
}) {
  const percentage = Math.min((currentXP / maxXP) * 100, 100);

  return (
    <div className="w-full">
      {/* Level + XP Text */}
      <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
        <span className="font-medium">Level {level}</span>
        <span>
          {currentXP} / {maxXP} XP
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: "var(--accent)",
          }}
        />
      </div>
    </div>
  );
}

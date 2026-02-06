export default function StatCard({
  title = "Stat",
  value = "0",
  icon = null,
  progress = null, // number (0–100)
}) {
  return (
    <div className="rounded-xl p-4 shadow-sm border border-border" style={{ backgroundColor: "var(--card)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>

        {icon && (
          <div className="text-accent text-xl">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-semibold text-foreground mb-2">
        {value}
      </div>

      {/* Progress Bar (Optional) */}
      {progress !== null && (
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--accent)",
            }}
          />
        </div>
      )}
    </div>
  );
}

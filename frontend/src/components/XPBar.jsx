import { motion } from 'framer-motion';

export default function XPBar({
  currentXP = 40,
  maxXP = 100,
  level = 1,
}) {
  const percentage = Math.min((currentXP / maxXP) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
        <span className="font-medium">Level {level}</span>
        <span>
          {currentXP} / {maxXP} XP
        </span>
      </div>

      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--border)" }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: "var(--accent)" }}
        />
      </div>
    </div>
  );
}

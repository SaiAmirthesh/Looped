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
        <motion.span
          key={level}
          initial={{ scale: 1.3, color: 'var(--primary)' }}
          animate={{ scale: 1, color: 'var(--muted-foreground)' }}
          transition={{ duration: 0.5 }}
          className="font-semibold"
        >
          Level {level}
        </motion.span>
        <motion.span
          key={`${level}-${currentXP}`}
          initial={{ opacity: 0.5, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentXP} / {maxXP} XP
        </motion.span>
      </div>

      {/* Track */}
      <div
        className="w-full h-3 rounded-full overflow-hidden relative"
        style={{ backgroundColor: 'var(--border)' }}
      >
        {/* Animated fill — key on level so level-up resets from 0, otherwise smooth transition */}
        <motion.div
          key={level}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          className="h-full rounded-full relative overflow-hidden"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {/* Shimmer sweep */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
            className="absolute inset-0 w-1/3"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
            }}
          />
        </motion.div>
      </div>

      {/* XP milestone dots */}
      <div className="flex justify-between mt-1">
        {[25, 50, 75].map((milestone) => (
          <div
            key={milestone}
            className="w-1 h-1 rounded-full transition-colors duration-500"
            style={{
              backgroundColor: percentage >= milestone ? 'var(--accent)' : 'var(--border)',
              marginLeft: `${milestone - 1}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

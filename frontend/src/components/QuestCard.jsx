import { motion, AnimatePresence } from 'framer-motion';

export default function QuestCard({
  title = "Quest Title",
  description = "Complete this quest to earn XP.",
  xpReward = 50,
  completed = false,
  difficulty = "easy",
  progress = 0,
  onToggle,
  onDelete
}) {
  const difficultyStyles = {
    easy: { text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30", glow: "rgba(34,197,94,0.15)" },
    medium: { text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", glow: "rgba(249,115,22,0.15)" },
    hard: { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", glow: "rgba(239,68,68,0.15)" }
  };

  const style = difficultyStyles[difficulty] || difficultyStyles.easy;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: completed ? 0.7 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={!completed ? {
        y: -3,
        boxShadow: `0 12px 40px -8px ${style.glow}, 0 4px 16px -4px rgba(0,0,0,0.3)`
      } : {}}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className={`rounded-xl p-4 border transition-colors ${
        completed ? 'border-border' : 'border-border'
      }`}
      style={{ backgroundColor: completed ? 'var(--muted)' : 'var(--card)' }}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-base font-semibold ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {title}
        </h3>
        <motion.span
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md"
        >
          +{xpReward} XP
        </motion.span>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{description}</p>

      <div className="flex justify-between items-center text-sm">
        <span className={`mt-4 px-2 py-1 rounded-md ${style.bg} ${style.text} ${style.border} border font-medium capitalize`}>
          {difficulty}
        </span>

        <div className="flex gap-2">
          <AnimatePresence mode="wait">
            {completed ? (
              <motion.span
                key="done"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="text-green-500 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Completed
              </motion.span>
            ) : (
              <motion.div key="actions" className="flex gap-2">
                <motion.button
                  onClick={onToggle}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="mt-4 px-3 py-1.5 bg-accent text-accent-foreground rounded-md hover:opacity-90 font-medium transition-opacity"
                >
                  Mark Complete
                </motion.button>
                {onDelete && (
                  <motion.button
                    onClick={onDelete}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="mt-4 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 font-medium transition-opacity"
                  >
                    Delete
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

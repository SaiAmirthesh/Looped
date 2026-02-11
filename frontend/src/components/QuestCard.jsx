import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { CheckCircle } from 'lucide-react';

export default function QuestCard({
  title = "Quest Title",
  description = "Complete this quest to earn XP.",
  xpReward = 50,
  completed = false,
  difficulty = "easy",
  onToggle,
  onDelete,
  index = 0
}) {
  const difficultyStyles = {
    easy: { text: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/30" },
    medium: { text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
    hard: { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" }
  };
  const style = difficultyStyles[difficulty] || difficultyStyles.easy;

  return (
    <Tooltip.Provider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        whileHover={{ y: -2 }}
        className={`rounded-xl p-4 border transition-all ${
          completed ? "border-border opacity-70" : "shadow-sm border-border hover:shadow-md"
        }`}
        style={{ backgroundColor: completed ? "var(--muted)" : "var(--card)" }}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className={`text-base font-semibold ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {title}
          </h3>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <span className="text-sm font-medium text-primary cursor-default">
                +{xpReward} XP
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content sideOffset={5} className="px-3 py-2 text-sm rounded-lg bg-popover border border-border shadow-lg">
                Earn {xpReward} XP when completed
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{description}</p>

        <div className="flex justify-between items-center text-sm">
          <span className={`px-2 py-1 rounded-md border font-medium capitalize ${style.bg} ${style.text} ${style.border}`}>
            {difficulty}
          </span>

          <div className="flex gap-2">
            {completed ? (
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-green-500 font-medium flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Completed
              </motion.span>
            ) : (
              <>
                <motion.button
                  onClick={onToggle}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 font-medium transition"
                >
                  Mark Complete
                </motion.button>
                {onDelete && (
                  <motion.button
                    onClick={onDelete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted font-medium transition"
                  >
                    Delete
                  </motion.button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </Tooltip.Provider>
  );
}

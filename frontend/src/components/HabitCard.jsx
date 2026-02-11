import { motion } from 'framer-motion';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Flame } from 'lucide-react';

export default function HabitCard({
  name = "New Habit",
  streak = 0,
  completed = false,
  category = "Other",
  onToggle,
  onDelete,
  index = 0
}) {
  return (
    <Tooltip.Provider delayDuration={300}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`flex items-center justify-between p-4 rounded-xl border transition-shadow ${
          completed ? "shadow-sm bg-muted/50" : "shadow-sm bg-card hover:shadow-md"
        }`}
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 flex-1">
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-colors ${
              completed ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary"
            }`}
          >
            {completed && (
              <motion.svg
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </motion.svg>
            )}
          </motion.button>

          <div className="flex-1">
            <span className={`text-base font-medium ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {name}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-md">
                {category}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <div className="flex items-center gap-1.5 text-sm">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-foreground">{streak}</span>
                <span className="text-muted-foreground text-xs">days</span>
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                sideOffset={5}
                className="px-3 py-2 text-sm rounded-lg bg-popover border border-border shadow-lg"
              >
                {streak} day streak — keep it up!
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          {onDelete && (
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <motion.button
                  onClick={onDelete}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </motion.button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content sideOffset={5} className="px-3 py-2 text-sm rounded-lg bg-popover border border-border shadow-lg">
                  Delete habit
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )}
        </div>
      </motion.div>
    </Tooltip.Provider>
  );
}

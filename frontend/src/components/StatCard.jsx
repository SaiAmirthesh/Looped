import { motion } from 'framer-motion';

export default function StatCard({
  title = "Stat",
  value = "0",
  icon = null,
  subtitle = null,
  progress = null,
  index = 0
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-xl p-5 shadow-sm border border-border"
      style={{ backgroundColor: "var(--card)" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          {title}
        </span>
        {icon && (
          <motion.div
            initial={{ rotate: -10, opacity: 0.5 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-accent text-xl"
          >
            {icon}
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-foreground mb-1"
      >
        {value}
      </motion.div>

      {subtitle && (
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      )}

      {progress !== null && (
        <div className="mt-3 w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="h-full rounded-full"
            style={{ backgroundColor: "var(--accent)" }}
          />
        </div>
      )}
    </motion.div>
  );
}

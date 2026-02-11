import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { motion } from 'framer-motion';

export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'default' }) {
  const isDestructive = variant === 'destructive';

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
            <AlertDialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              />
            </AlertDialog.Overlay>
            <AlertDialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-xl border bg-card p-6 shadow-2xl"
                style={{ borderColor: 'var(--border)' }}
              >
                <AlertDialog.Title className="text-lg font-semibold text-foreground mb-2">
                  {title}
                </AlertDialog.Title>
                <AlertDialog.Description className="text-sm text-muted-foreground mb-6">
                  {description}
                </AlertDialog.Description>
                <div className="flex gap-3 justify-end">
                  <AlertDialog.Cancel asChild>
                    <button
                      className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      {cancelText}
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      onClick={onConfirm}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isDestructive
                          ? 'bg-destructive text-destructive-foreground hover:opacity-90'
                          : 'bg-primary text-primary-foreground hover:opacity-90'
                      }`}
                    >
                      {confirmText}
                    </button>
                  </AlertDialog.Action>
                </div>
              </motion.div>
            </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

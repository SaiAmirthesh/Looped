export default function Modal({
  open = false,
  title = "",
  children,
  onClose,
}) {
  if (!open) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/40 backdrop-blur-sm
      "
    >
      {/* Modal Card */}
      <div
        className="
          w-full max-w-md mx-4
          rounded-md border
          bg-(--color-card)
          text-(--color-card-foreground)
          border-(--color-border)
          shadow-lg
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border)">
          <h2 className="text-sm font-semibold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="
              text-(--color-muted-foreground)
              hover:text-(--color-foreground)
              transition-colors
            "
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import Icon from "./Icon.jsx";

// Lightweight centered modal. Closes on Escape and backdrop click.
export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-surface-base/75 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="w-full max-w-lg panel p-6 fade-in max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-headline-md text-headline-md text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="h-9 w-9 grid place-items-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container-high transition-colors"
              aria-label="Close"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>
        )}
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

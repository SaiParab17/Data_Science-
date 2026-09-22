// DataWatch — Drawer Component (slide-in from right)
import { useEffect, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}

const WIDTH_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function Drawer({ open, onClose, title, subtitle, children, width = "lg" }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC key closes drawer
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-inverse-surface/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={`fixed top-0 right-0 h-full w-full ${WIDTH_MAP[width]} bg-surface-container-low z-50 overflow-y-auto shadow-overlay border-l border-outline-variant/30 flex flex-col focus:outline-none`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Drawer Header */}
            {(title || subtitle) && (
              <div className="sticky top-0 z-10 bg-surface-container-low border-b border-outline-variant/30 px-space-lg py-space-md flex items-start justify-between gap-space-md">
                <div>
                  {title && (
                    <h2 className="font-space text-headline-sm text-on-surface">{title}</h2>
                  )}
                  {subtitle && (
                    <p className="font-mono text-tech-sm text-on-surface-variant mt-space-2xs">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close drawer"
                  className="btn-ghost p-space-xs rounded-lg flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Drawer Content */}
            <div className="flex-1 p-space-lg overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

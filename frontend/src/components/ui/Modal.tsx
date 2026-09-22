// DataWatch — Modal Component
import { useEffect, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className={`relative w-full ${SIZE_MAP[size]} bg-surface-container-low rounded-2xl shadow-overlay border border-outline-variant/30 focus:outline-none overflow-hidden`}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            {title && (
              <div className="flex items-center justify-between px-space-lg py-space-md border-b border-outline-variant/30">
                <h2 className="font-space text-headline-sm text-on-surface">{title}</h2>
                <button onClick={onClose} className="btn-ghost p-space-xs rounded-lg" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="p-space-lg">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

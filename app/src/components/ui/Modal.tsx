import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  /** Max width utility class, defaults to max-w-md. */
  widthClass?: string;
  dismissable?: boolean;
}

export function Modal({ open, onClose, children, widthClass = 'max-w-md', dismissable = true }: ModalProps) {
  useEffect(() => {
    if (!open || !dismissable || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, dismissable]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            aria-label="Close"
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => dismissable && onClose?.()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${widthClass} rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl`}
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          >
            {dismissable && onClose && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute top-3 right-3 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

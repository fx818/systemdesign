import { AnimatePresence, motion } from 'framer-motion';
import { create } from 'zustand';
import { Icon } from './Icon';

export interface ToastItem {
  id: number;
  text: string;
  icon?: string;
  tone: 'xp' | 'info' | 'warn';
}

interface ToastStore {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 2600);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Fire-and-forget toast, e.g. `toast('+50 XP', { icon: 'sparkles', tone: 'xp' })`. */
export function toast(text: string, opts: { icon?: string; tone?: ToastItem['tone'] } = {}) {
  useToastStore.getState().push({ text, icon: opts.icon, tone: opts.tone ?? 'info' });
}

const tones: Record<ToastItem['tone'], string> = {
  xp: 'border-amber-400/50 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.25)]',
  info: 'border-cyan-400/50 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.2)]',
  warn: 'border-rose-400/50 text-rose-300 shadow-[0_0_24px_rgba(251,113,133,0.25)]',
};

/** Mount once in the app shell. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[60] flex w-64 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto flex items-center gap-2 rounded-xl border bg-slate-900/95 px-4 py-2.5 text-sm font-semibold backdrop-blur ${tones[t.tone]}`}
          >
            {t.icon && <Icon name={t.icon} size={16} />}
            <span>{t.text}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

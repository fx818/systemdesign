import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import type { CharacterId, DialogueLine } from '@/types/content';

export interface CharacterMeta {
  name: string;
  initials: string;
  /** Avatar circle classes (character colour). */
  color: string;
}

export const CHARACTERS: Record<CharacterId, CharacterMeta> = {
  maya: { name: 'Maya', initials: 'M', color: 'bg-violet-400/20 border-violet-400/70 text-violet-300' },
  ravi: { name: 'Ravi', initials: 'R', color: 'bg-cyan-400/20 border-cyan-400/70 text-cyan-300' },
  pager: { name: 'The Pager', initials: '!', color: 'bg-rose-400/20 border-rose-400/70 text-rose-300' },
  player: { name: 'You', initials: 'Y', color: 'bg-emerald-400/20 border-emerald-400/70 text-emerald-300' },
  narrator: { name: '', initials: '', color: 'bg-slate-700/30 border-slate-600 text-slate-400' },
};

type Mood = NonNullable<DialogueLine['mood']>;

const moodRing: Record<Mood, string> = {
  neutral: '',
  happy: 'shadow-[0_0_18px_rgba(52,211,153,0.45)]',
  worried: 'shadow-[0_0_18px_rgba(251,191,36,0.45)]',
  panic: 'shadow-[0_0_18px_rgba(251,113,133,0.6)]',
  proud: 'shadow-[0_0_18px_rgba(167,139,250,0.5)]',
};

export function Avatar({ who, mood = 'neutral', size = 48 }: { who: CharacterId; mood?: Mood; size?: number }) {
  const meta = CHARACTERS[who];
  const circle = (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full border-2 font-bold',
        meta.color,
        moodRing[mood],
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {meta.initials}
    </div>
  );
  if (who === 'pager') {
    // The Pager never sits still.
    return (
      <motion.div
        animate={{ x: [0, -2, 2, -2, 0], rotate: [0, -2, 2, -1, 0] }}
        transition={{ duration: 0.45, repeat: Infinity, repeatDelay: 0.6 }}
      >
        {circle}
      </motion.div>
    );
  }
  return circle;
}

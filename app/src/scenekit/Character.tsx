import type { CharacterId, DialogueLine } from '@/types/content';
import { C, FONT } from './theme';
import { clamp, ease, pulse, shake } from './time';
import { wrapText } from './text';

export type Mood = NonNullable<DialogueLine['mood']>;

export const CHARACTER_META: Record<CharacterId, { name: string; role: string; color: string }> = {
  maya: { name: 'Maya', role: 'Founder & CEO', color: C.violet },
  ravi: { name: 'Ravi', role: 'Senior architect', color: C.cyan },
  pager: { name: 'The Pager', role: 'Incident bot', color: C.rose },
  player: { name: 'You', role: 'First engineer', color: C.emerald },
  narrator: { name: 'Narrator', role: '', color: C.amber },
};

export interface CharacterProps {
  who: CharacterId;
  mood?: Mood;
  x: number;
  y: number;
  /** Height-ish in px (default 140). */
  size?: number;
  /** Seconds — drives blinking, talking mouth and the pager's buzz. */
  time?: number;
  talking?: boolean;
  /** Speech bubble text. */
  say?: string;
  /** Which side the bubble sits on. */
  bubble?: 'left' | 'right';
  /** Show name tag under the avatar. */
  nameTag?: boolean;
  /** 0..1 entrance. */
  appear?: number;
  flip?: boolean;
}

const SKIN: Partial<Record<CharacterId, string>> = { maya: '#d9a27c', ravi: '#a8714f', player: '#eec39a' };

function Face({ mood, time, talking, seed }: { mood: Mood; time: number; talking: boolean; seed: number }) {
  const ink = '#1e1b2e';
  const blink = mood !== 'panic' && mood !== 'proud' && ((time + seed) % 3.7) < 0.13;
  const eyes =
    mood === 'proud' ? (
      <g stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round">
        <path d="M-16 -8 Q-11 -15 -6 -8" />
        <path d="M6 -8 Q11 -15 16 -8" />
      </g>
    ) : blink ? (
      <g stroke={ink} strokeWidth={3} strokeLinecap="round">
        <line x1={-15} y1={-9} x2={-7} y2={-9} />
        <line x1={7} y1={-9} x2={15} y2={-9} />
      </g>
    ) : mood === 'panic' ? (
      <g>
        <circle cx={-11} cy={-9} r={7} fill="#fff" />
        <circle cx={11} cy={-9} r={7} fill="#fff" />
        <circle cx={-11} cy={-9} r={2.6} fill={ink} />
        <circle cx={11} cy={-9} r={2.6} fill={ink} />
      </g>
    ) : (
      <g fill={ink}>
        <circle cx={-11} cy={-9} r={3.6} />
        <circle cx={11} cy={-9} r={3.6} />
        <circle cx={-10} cy={-10.5} r={1.1} fill="#fff" />
        <circle cx={12} cy={-10.5} r={1.1} fill="#fff" />
      </g>
    );
  const brows =
    mood === 'worried' || mood === 'panic' ? (
      <g stroke={ink} strokeWidth={3} strokeLinecap="round">
        <line x1={-17} y1={-17} x2={-6} y2={-22} />
        <line x1={6} y1={-22} x2={17} y2={-17} />
      </g>
    ) : (
      <g stroke={ink} strokeWidth={3} strokeLinecap="round" transform={mood === 'happy' || mood === 'proud' ? 'translate(0 -3)' : undefined}>
        <line x1={-17} y1={-19} x2={-6} y2={-20} />
        <line x1={6} y1={-20} x2={17} y2={-19} />
      </g>
    );
  let mouth;
  if (talking) {
    const o = 1.5 + 5 * pulse(time, 0.24, seed);
    mouth = <ellipse cx={0} cy={9} rx={7} ry={o} fill={ink} />;
  } else if (mood === 'panic') mouth = <ellipse cx={0} cy={11} rx={6} ry={8} fill={ink} />;
  else if (mood === 'worried') mouth = <path d="M-9 13 Q0 6 9 13" stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" />;
  else if (mood === 'happy' || mood === 'proud') mouth = <path d="M-12 4 Q0 22 12 4 Z" fill={ink} />;
  else mouth = <path d="M-9 7 Q0 13 9 7" stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" />;
  return (
    <g>
      {brows}
      {eyes}
      {mouth}
      {(mood === 'happy' || mood === 'proud') && (
        <g fill={C.rose} opacity={0.35}>
          <circle cx={-19} cy={3} r={5} />
          <circle cx={19} cy={3} r={5} />
        </g>
      )}
      {mood === 'panic' && <path d="M26 -26 Q31 -16 26 -12 Q21 -16 26 -26 Z" fill={C.sky} />}
    </g>
  );
}

function Human({ who, mood, time, talking }: { who: 'maya' | 'ravi' | 'player'; mood: Mood; time: number; talking: boolean }) {
  const skin = SKIN[who];
  const col = CHARACTER_META[who].color;
  const seed = who === 'maya' ? 0.7 : who === 'ravi' ? 1.9 : 2.6;
  const bob = Math.sin(time * 2 + seed) * 1.5;
  return (
    <g transform={`translate(0 ${bob})`}>
      {who === 'player' && <circle cx={0} cy={-10} r={40} fill="#065f46" />}
      {who === 'maya' && (
        <g fill="#2a1b3d">
          <circle cx={0} cy={-14} r={36} />
          <circle cx={0} cy={-52} r={13} />
        </g>
      )}
      {/* body */}
      <path d="M-50 62 Q-50 24 0 24 Q50 24 50 62 Z" fill={who === 'player' ? '#047857' : col} />
      {who === 'maya' && <path d="M-12 24 L0 46 L12 24 Z" fill="#f1f5f9" />}
      {who === 'ravi' && <path d="M-16 24 Q0 36 16 24" fill="none" stroke="#0e7490" strokeWidth={5} />}
      {who === 'player' && (
        <g stroke="#a7f3d0" strokeWidth={2.5}>
          <line x1={-8} y1={28} x2={-9} y2={44} />
          <line x1={8} y1={28} x2={9} y2={44} />
        </g>
      )}
      <rect x={-9} y={14} width={18} height={14} fill={skin} />
      {/* head */}
      <circle cx={0} cy={-8} r={30} fill={skin} />
      {who === 'maya' && <path d="M-31 -10 Q-30 -40 0 -40 Q26 -40 31 -12 Q14 -30 -8 -26 Q-22 -24 -31 -10 Z" fill="#2a1b3d" />}
      {who === 'ravi' && (
        <g>
          <path d="M-30 -14 Q-28 -40 0 -40 Q28 -40 30 -14 Q22 -30 0 -30 Q-22 -30 -30 -14 Z" fill="#334155" />
          <path d="M-29 -2 Q-28 26 0 26 Q28 26 29 -2 Q24 14 12 12 Q0 18 -12 12 Q-24 14 -29 -2 Z" fill="#3b2a20" />
        </g>
      )}
      {who === 'player' && <path d="M-30 -12 Q-26 -38 2 -38 Q28 -36 30 -14 Q16 -26 -2 -22 Q-18 -26 -30 -12 Z" fill="#6b4226" />}
      <Face mood={mood} time={time} talking={talking} seed={seed} />
      {who === 'ravi' && (
        <g fill="none" stroke={C.cyan} strokeWidth={2.5}>
          <rect x={-20} y={-16} width={17} height={13} rx={4} />
          <rect x={3} y={-16} width={17} height={13} rx={4} />
          <line x1={-3} y1={-11} x2={3} y2={-11} />
        </g>
      )}
    </g>
  );
}

function Pager({ mood, time, talking }: { mood: Mood; time: number; talking: boolean }) {
  const angry = mood !== 'happy' && mood !== 'proud';
  const j = shake(time, angry ? 2.5 : 0.6, 5);
  const buzz = pulse(time, 0.3);
  return (
    <g transform={`translate(${j.x} ${j.y})`}>
      {angry && (
        <g stroke={C.rose} strokeWidth={3} strokeLinecap="round" opacity={0.4 + 0.6 * buzz}>
          <path d="M-56 -20 Q-62 0 -56 20" fill="none" />
          <path d="M-66 -28 Q-74 0 -66 28" fill="none" />
          <path d="M56 -20 Q62 0 56 20" fill="none" />
          <path d="M66 -28 Q74 0 66 28" fill="none" />
        </g>
      )}
      <line x1={26} y1={-46} x2={34} y2={-66} stroke={C.rose} strokeWidth={4} strokeLinecap="round" />
      <circle cx={34} cy={-68} r={5} fill={buzz > 0.5 ? C.rose : '#7f1d1d'} filter="url(#sk-glow)" />
      <rect x={-44} y={-48} width={88} height={100} rx={18} fill="#3f0d1b" stroke={C.rose} strokeWidth={3} />
      <rect x={-34} y={-38} width={68} height={50} rx={8} fill="#0b1222" stroke={C.rose} strokeWidth={1.5} />
      {/* face on the screen */}
      <g stroke={C.rose} strokeWidth={3} strokeLinecap="round" fill="none">
        {angry ? (
          <>
            <line x1={-20} y1={-26} x2={-8} y2={-21} />
            <line x1={20} y1={-26} x2={8} y2={-21} />
          </>
        ) : null}
      </g>
      <circle cx={-13} cy={-15} r={4} fill={C.rose} />
      <circle cx={13} cy={-15} r={4} fill={C.rose} />
      {talking ? (
        <rect x={-10} y={-4} width={20} height={4 + 6 * pulse(time, 0.2)} rx={2} fill={C.rose} />
      ) : (
        <path d={angry ? 'M-12 4 Q0 -4 12 4' : 'M-12 -2 Q0 8 12 -2'} stroke={C.rose} strokeWidth={3} fill="none" strokeLinecap="round" />
      )}
      {[-18, 0, 18].map((x) => (
        <rect key={x} x={x - 7} y={24} width={14} height={14} rx={4} fill="#7f1d1d" stroke={C.rose} strokeWidth={1.5} />
      ))}
    </g>
  );
}

function NarratorGlyph() {
  return (
    <g>
      <circle r={40} fill={`${C.amber}22`} stroke={C.amber} strokeWidth={3} />
      <path d="M-22 -14 Q-11 -20 0 -14 Q11 -20 22 -14 V18 Q11 12 0 18 Q-11 12 -22 18 Z M0 -14 V18" fill="none" stroke={C.amber} strokeWidth={3} strokeLinejoin="round" />
    </g>
  );
}

/**
 * Story avatars: Maya (CEO, violet), Ravi (mentor, cyan, glasses + beard),
 * the Pager (rose, buzzing villain), the player (emerald hoodie) and the narrator.
 * Centred roughly on the head.
 */
export function Character({ who, mood = 'neutral', x, y, size = 140, time = 0, talking = false, say, bubble = 'right', nameTag, appear, flip }: CharacterProps) {
  if (appear !== undefined && appear <= 0) return null;
  const s = (size / 140) * (appear === undefined ? 1 : Math.max(0.001, ease.outBack(clamp(appear))));
  const meta = CHARACTER_META[who];
  const lines = say ? wrapText(say, 28) : [];
  const bw = 300;
  const bh = 26 + lines.length * 24;
  const bx = bubble === 'right' ? 70 : -70 - bw;
  const by = -90 - bh / 2;
  return (
    <g transform={`translate(${x} ${y})`} opacity={appear === undefined ? 1 : clamp(appear * 2)}>
      <g transform={`scale(${s * (flip ? -1 : 1)} ${s})`}>
        {who === 'pager' ? (
          <Pager mood={mood} time={time} talking={talking} />
        ) : who === 'narrator' ? (
          <NarratorGlyph />
        ) : (
          <Human who={who} mood={mood} time={time} talking={talking} />
        )}
      </g>
      {nameTag && (
        <g transform={`translate(0 ${74 * (size / 140)})`}>
          <rect x={-meta.name.length * 5.5 - 14} y={-14} width={meta.name.length * 11 + 28} height={28} rx={14} fill={C.bg} stroke={meta.color} strokeWidth={1.5} />
          <text y={6} textAnchor="middle" fill={meta.color} fontSize={15} fontWeight={800} fontFamily={FONT}>
            {meta.name}
          </text>
        </g>
      )}
      {say && (
        <g transform={`scale(${appear === undefined ? 1 : clamp(appear * 1.4)})`}>
          <rect x={bx} y={by} width={bw} height={bh} rx={18} fill={C.white} />
          <path d={bubble === 'right' ? `M${bx + 18} ${by + bh - 6} L${bx - 14} ${by + bh + 22} L${bx + 44} ${by + bh}` : `M${bx + bw - 18} ${by + bh - 6} L${bx + bw + 14} ${by + bh + 22} L${bx + bw - 44} ${by + bh}`} fill={C.white} />
          {lines.map((l, i) => (
            <text key={i} x={bx + 18} y={by + 30 + i * 24} fill={C.bg} fontSize={18} fontWeight={600} fontFamily={FONT}>
              {l}
            </text>
          ))}
        </g>
      )}
    </g>
  );
}

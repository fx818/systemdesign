import { UNIT_LADDER } from '../../common/numbers';

/** Fixed scramble so the board is the same every play (and in tests). */
export const LADDER_TILES = ['TB', 'Bit', 'MB', 'PB', 'Byte', 'GB', 'KB'] as const;
export const LADDER_ORDER: readonly string[] = UNIT_LADDER;

export interface ConvertQ { prompt: string; options: string[]; answer: number; why: string }
export const CONVERT_QS: ConvertQ[] = [
  { prompt: '1 byte = ? bits', options: ['8 bits', '10 bits', '16 bits', '1,024 bits'], answer: 0, why: 'A byte is a sequence of 8 bits.' },
  { prompt: '2^20 bytes ≈ ?', options: ['1 KB', '1 MB', '1 GB', '1 TB'], answer: 1, why: '2^20 ≈ 1 million bytes: a megabyte.' },
  { prompt: '1 GB = 2^? bytes', options: ['2^10', '2^20', '2^30', '2^40'], answer: 2, why: 'Gigabyte: 2^30 bytes, about a billion.' },
  { prompt: '1 TB ≈ how many GB?', options: ['about 10', 'about 100', 'about 1,000', 'about 1,000,000'], answer: 2, why: 'One rung up the ladder: × 1,024 ≈ × 1,000.' },
  { prompt: 'A 2,000-character ASCII post ≈ ?', options: ['2 bytes', '2 KB', '2 MB', '16 KB'], answer: 1, why: '1 byte per ASCII character: 2,000 bytes ≈ 2 KB.' },
  { prompt: '1 PB ≈ ?', options: ['1,000 GB', '1,000 TB', '1,000 MB', '1 million TB'], answer: 1, why: 'Petabyte is one rung above terabyte: about 1,000 TB.' },
  { prompt: '2^50 ≈ ?', options: ['1 billion', '1 trillion', '1 quadrillion', '1 million'], answer: 2, why: '2^50 ≈ 10^15: one quadrillion (a petabyte of bytes).' },
  { prompt: '5,000 MB ≈ ?', options: ['5 KB', '5 GB', '5 TB', '50 GB'], answer: 1, why: 'MB to GB is one rung: ÷ 1,000. 5,000 MB ≈ 5 GB.' },
];
export const SECONDS_PER_Q = 12;

export const ladderPoints = (mistakes: number) => Math.max(0, 1 - mistakes * 0.25);
export const unitLadderScore = (mistakes: number, correct: number) =>
  Math.round((0.25 * ladderPoints(mistakes) + 0.75 * (correct / CONVERT_QS.length)) * 100) / 100;

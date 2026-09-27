import type { AgeBand } from "@/lib/scoring/engine";

export const DEFAULT_WPM: Record<AgeBand, number> = {
  "8-11": 140,
  "12-15": 180,
};

export const MIN_WPM = 80;
export const MAX_WPM = 1000;
export const WPM_STEP = 50;
export const WPM_PRESETS = [80, 140, 300, 600, 1000] as const;

const HYPHENS = /[-–—]/g;
const LETTER = /\p{L}/u;

export function splitWords(text: string): string[] {
  return text
    .replace(HYPHENS, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export type OrpParts = {
  before: string;
  pivot: string;
  after: string;
};

export function orpParts(word: string): OrpParts {
  let letterCount = 0;
  let firstLetterIndex = -1;
  let secondLetterIndex = -1;

  for (let index = 0; index < word.length; index++) {
    if (LETTER.test(word[index])) {
      letterCount += 1;
      if (letterCount === 1) firstLetterIndex = index;
      if (letterCount === 2) {
        secondLetterIndex = index;
        break;
      }
    }
  }

  const pivotIndex =
    secondLetterIndex >= 0 ? secondLetterIndex : firstLetterIndex;

  if (pivotIndex === -1) {
    return { before: "", pivot: word, after: "" };
  }

  return {
    before: word.slice(0, pivotIndex),
    pivot: word[pivotIndex],
    after: word.slice(pivotIndex + 1),
  };
}

export function msPerWord(wpm: number): number {
  const safe = Math.min(MAX_WPM, Math.max(MIN_WPM, wpm));
  return Math.round(60_000 / safe);
}

export function clampWpm(wpm: number): number {
  return Math.min(MAX_WPM, Math.max(MIN_WPM, wpm));
}

export function countLetters(word: string): number {
  let count = 0;
  for (const char of word) {
    if (LETTER.test(char)) count += 1;
  }
  return count;
}

export function isSingleLetterWord(word: string): boolean {
  return countLetters(word) <= 1;
}

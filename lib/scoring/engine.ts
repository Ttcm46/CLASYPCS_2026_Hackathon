export type AgeBand = "8-11" | "12-15";
export type MedalLevel = "none" | "bronze" | "silver" | "gold";

export const WORDS_PER_READING_SECOND = 9;
export const DAILY_RANKING_CAP = 8;
export const DAILY_ACCURACY_SPEED_THRESHOLD = 0.4;

export const STREAK_BONUSES = [
  { day: 3, points: 50 },
  { day: 5, points: 100 },
  { day: 7, points: 200 },
] as const;

export const MEDAL_THRESHOLDS = {
  bronze: 5,
  silver: 15,
  gold: 30,
} as const;

export type QuestionScore = {
  basePoints: number;
  speedMultiplier: number;
  points: number;
  speedBonus: number;
  readingSkipPenalty: boolean;
};

export const READING_BASE_WPM = 140;
export const READING_MIN_WPM = 80;
export const READING_MAX_WPM = 1000;
export const READING_MIN_MULTIPLIER = 0.85;
export const READING_MAX_MULTIPLIER = 2;

export function speedMultiplierFromWpm(wpm: number): number {
  const safe = Math.min(READING_MAX_WPM, Math.max(READING_MIN_WPM, wpm));
  const raw =
    safe <= READING_BASE_WPM
      ? READING_MIN_MULTIPLIER +
        ((safe - READING_MIN_WPM) / (READING_BASE_WPM - READING_MIN_WPM)) *
          (1 - READING_MIN_MULTIPLIER)
      : 1 +
        Math.log(safe / READING_BASE_WPM) /
          Math.log(READING_MAX_WPM / READING_BASE_WPM);
  return Math.round(raw * 100) / 100;
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function minReadingSeconds(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_READING_SECOND));
}

export function speedBonusForMs(responseMs: number): number {
  if (responseMs <= 5_000) return 50;
  if (responseMs <= 10_000) return 30;
  if (responseMs <= 20_000) return 15;
  return 0;
}

export function speedMultiplierFromResponseMs(responseMs: number): number {
  if (responseMs <= 5_000) return 1.2;
  if (responseMs <= 10_000) return 1.1;
  if (responseMs <= 20_000) return 1.05;
  return 1;
}

export function formatMultiplier(value: number): string {
  return `×${value.toFixed(2).replace(/\.?0+$/, "")}`;
}

export function isSpeedBonusEligible(
  dailyFirstAttemptAccuracy: number | null,
): boolean {
  if (dailyFirstAttemptAccuracy === null) return true;
  return dailyFirstAttemptAccuracy >= DAILY_ACCURACY_SPEED_THRESHOLD;
}

export function scoreQuestion(input: {
  isCorrect: boolean;
  attemptNumber: 1 | 2;
  minReadingMet: boolean;
  responseMs: number;
  speedBonusEligible: boolean;
  readingWpm?: number;
}): QuestionScore {
  const empty = {
    basePoints: 0,
    speedMultiplier: 1,
    points: 0,
    speedBonus: 0,
    readingSkipPenalty: false,
  };

  if (!input.isCorrect) return empty;

  if (input.attemptNumber === 2) {
    return {
      basePoints: 40,
      speedMultiplier: 1,
      points: 40,
      speedBonus: 0,
      readingSkipPenalty: false,
    };
  }

  const readingSkipPenalty = !input.minReadingMet;
  const basePoints = readingSkipPenalty ? 70 : 100;
  const answerMultiplier = speedMultiplierFromResponseMs(input.responseMs);
  const readingMultiplier =
    typeof input.readingWpm === "number"
      ? speedMultiplierFromWpm(input.readingWpm)
      : 1;
  const speedMultiplier =
    !readingSkipPenalty && input.speedBonusEligible
      ? Math.round(answerMultiplier * readingMultiplier * 100) / 100
      : 1;
  const points = Math.round(basePoints * speedMultiplier);

  return {
    basePoints,
    speedMultiplier,
    points,
    speedBonus: points - basePoints,
    readingSkipPenalty,
  };
}

export function caseCleanBonus(firstAttemptCorrectCount: number): number {
  if (firstAttemptCorrectCount >= 3) return 80;
  if (firstAttemptCorrectCount === 2) return 40;
  return 0;
}

export function countsForWeeklyRanking(casesAlreadyCompletedToday: number): boolean {
  return casesAlreadyCompletedToday < DAILY_RANKING_CAP;
}

export function medalLevel(casesCompleted: number): MedalLevel {
  if (casesCompleted >= MEDAL_THRESHOLDS.gold) return "gold";
  if (casesCompleted >= MEDAL_THRESHOLDS.silver) return "silver";
  if (casesCompleted >= MEDAL_THRESHOLDS.bronze) return "bronze";
  return "none";
}

export function nextMedal(casesCompleted: number): {
  level: Exclude<MedalLevel, "none">;
  remaining: number;
} | null {
  if (casesCompleted < MEDAL_THRESHOLDS.bronze) {
    return {
      level: "bronze",
      remaining: MEDAL_THRESHOLDS.bronze - casesCompleted,
    };
  }
  if (casesCompleted < MEDAL_THRESHOLDS.silver) {
    return {
      level: "silver",
      remaining: MEDAL_THRESHOLDS.silver - casesCompleted,
    };
  }
  if (casesCompleted < MEDAL_THRESHOLDS.gold) {
    return {
      level: "gold",
      remaining: MEDAL_THRESHOLDS.gold - casesCompleted,
    };
  }
  return null;
}

export function streakBonusForDay(
  streakDays: number,
  claimedDays: number[],
): number {
  const threshold = STREAK_BONUSES.find((bonus) => bonus.day === streakDays);
  if (!threshold) return 0;
  if (claimedDays.includes(streakDays)) return 0;
  return threshold.points;
}

export function previousDateKey(todayKey: string): string {
  const [year, month, day] = todayKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return toDateKey(date);
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfWeek(date: Date = new Date()): Date {
  const start = new Date(date);
  const weekday = start.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  start.setDate(start.getDate() + offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function updateStreak(input: {
  lastActiveDate: string | null;
  today: string;
  currentStreak: number;
}): { streak: number; alreadyCountedToday: boolean } {
  if (input.lastActiveDate === input.today) {
    return { streak: input.currentStreak, alreadyCountedToday: true };
  }

  if (input.lastActiveDate === previousDateKey(input.today)) {
    return { streak: input.currentStreak + 1, alreadyCountedToday: false };
  }

  return { streak: 1, alreadyCountedToday: false };
}

import { describe, expect, it } from "vitest";
import {
  caseCleanBonus,
  countsForWeeklyRanking,
  isSpeedBonusEligible,
  medalLevel,
  minReadingSeconds,
  previousDateKey,
  scoreQuestion,
  formatMultiplier,
  speedMultiplierFromResponseMs,
  speedMultiplierFromWpm,
  streakBonusForDay,
  updateStreak,
} from "./engine";

describe("minReadingSeconds", () => {
  it("uses about one second per nine words", () => {
    expect(minReadingSeconds(90)).toBe(10);
    expect(minReadingSeconds(8)).toBe(1);
  });
});

describe("speed multipliers", () => {
  it("scales reading speed around 140 ppm with a soft cap at 1000", () => {
    expect(speedMultiplierFromWpm(80)).toBe(0.85);
    expect(speedMultiplierFromWpm(140)).toBe(1);
    expect(speedMultiplierFromWpm(280)).toBe(1.35);
    expect(speedMultiplierFromWpm(1000)).toBe(2);
    expect(speedMultiplierFromWpm(70)).toBe(0.85);
    expect(speedMultiplierFromWpm(1400)).toBe(2);
  });

  it("formats the multiplier without a leading plus", () => {
    expect(formatMultiplier(0.85)).toBe("×0.85");
    expect(formatMultiplier(1.15)).toBe("×1.15");
    expect(formatMultiplier(2)).toBe("×2");
  });

  it("uses answer-time tiers as a gentle multiplier", () => {
    expect(speedMultiplierFromResponseMs(5_000)).toBe(1.2);
    expect(speedMultiplierFromResponseMs(5_001)).toBe(1.1);
    expect(speedMultiplierFromResponseMs(10_000)).toBe(1.1);
    expect(speedMultiplierFromResponseMs(20_000)).toBe(1.05);
    expect(speedMultiplierFromResponseMs(20_001)).toBe(1);
  });
});

describe("scoreQuestion", () => {
  it("multiplies a first-attempt hit by answer speed", () => {
    expect(
      scoreQuestion({
        isCorrect: true,
        attemptNumber: 1,
        minReadingMet: true,
        responseMs: 12_000,
        speedBonusEligible: true,
      }),
    ).toEqual({
      basePoints: 100,
      speedMultiplier: 1.05,
      points: 105,
      speedBonus: 5,
      readingSkipPenalty: false,
    });
  });

  it("multiplies by reading ppm and answer time together", () => {
    expect(
      scoreQuestion({
        isCorrect: true,
        attemptNumber: 1,
        minReadingMet: true,
        responseMs: 3_000,
        speedBonusEligible: true,
        readingWpm: 280,
      }),
    ).toEqual({
      basePoints: 100,
      speedMultiplier: 1.62,
      points: 162,
      speedBonus: 62,
      readingSkipPenalty: false,
    });
  });

  it("awards 40 on a second-attempt hit and no speed multiplier", () => {
    expect(
      scoreQuestion({
        isCorrect: true,
        attemptNumber: 2,
        minReadingMet: true,
        responseMs: 3_000,
        speedBonusEligible: true,
        readingWpm: 280,
      }),
    ).toEqual({
      basePoints: 40,
      speedMultiplier: 1,
      points: 40,
      speedBonus: 0,
      readingSkipPenalty: false,
    });
  });

  it("awards 0 on a miss", () => {
    expect(
      scoreQuestion({
        isCorrect: false,
        attemptNumber: 1,
        minReadingMet: true,
        responseMs: 2_000,
        speedBonusEligible: true,
      }),
    ).toEqual({
      basePoints: 0,
      speedMultiplier: 1,
      points: 0,
      speedBonus: 0,
      readingSkipPenalty: false,
    });
  });

  it("applies the reading-skip penalty and blocks the multiplier", () => {
    expect(
      scoreQuestion({
        isCorrect: true,
        attemptNumber: 1,
        minReadingMet: false,
        responseMs: 1_000,
        speedBonusEligible: true,
        readingWpm: 280,
      }),
    ).toEqual({
      basePoints: 70,
      speedMultiplier: 1,
      points: 70,
      speedBonus: 0,
      readingSkipPenalty: true,
    });
  });

  it("blocks the multiplier when daily accuracy is below 40%", () => {
    expect(
      scoreQuestion({
        isCorrect: true,
        attemptNumber: 1,
        minReadingMet: true,
        responseMs: 2_000,
        speedBonusEligible: false,
        readingWpm: 280,
      }),
    ).toMatchObject({
      points: 100,
      speedMultiplier: 1,
      speedBonus: 0,
    });
  });
});

describe("caseCleanBonus", () => {
  it("awards 80 / 40 / 0", () => {
    expect(caseCleanBonus(3)).toBe(80);
    expect(caseCleanBonus(2)).toBe(40);
    expect(caseCleanBonus(1)).toBe(0);
    expect(caseCleanBonus(0)).toBe(0);
  });
});

describe("anti-abuse helpers", () => {
  it("caps weekly ranking after 8 cases", () => {
    expect(countsForWeeklyRanking(7)).toBe(true);
    expect(countsForWeeklyRanking(8)).toBe(false);
  });

  it("gates speed bonus on daily accuracy", () => {
    expect(isSpeedBonusEligible(null)).toBe(true);
    expect(isSpeedBonusEligible(0.4)).toBe(true);
    expect(isSpeedBonusEligible(0.39)).toBe(false);
  });
});

describe("medals and streaks", () => {
  it("unlocks bronze / silver / gold at 5 / 15 / 30", () => {
    expect(medalLevel(4)).toBe("none");
    expect(medalLevel(5)).toBe("bronze");
    expect(medalLevel(15)).toBe("silver");
    expect(medalLevel(30)).toBe("gold");
  });

  it("pays streak bonuses once per threshold", () => {
    expect(streakBonusForDay(3, [])).toBe(50);
    expect(streakBonusForDay(5, [])).toBe(100);
    expect(streakBonusForDay(7, [])).toBe(200);
    expect(streakBonusForDay(3, [3])).toBe(0);
    expect(streakBonusForDay(4, [])).toBe(0);
  });

  it("increments a consecutive streak and resets after a gap", () => {
    expect(
      updateStreak({
        lastActiveDate: "2026-09-20",
        today: "2026-09-21",
        currentStreak: 2,
      }),
    ).toEqual({ streak: 3, alreadyCountedToday: false });

    expect(
      updateStreak({
        lastActiveDate: "2026-09-21",
        today: "2026-09-21",
        currentStreak: 3,
      }),
    ).toEqual({ streak: 3, alreadyCountedToday: true });

    expect(
      updateStreak({
        lastActiveDate: "2026-09-18",
        today: "2026-09-21",
        currentStreak: 4,
      }),
    ).toEqual({ streak: 1, alreadyCountedToday: false });
  });

  it("computes the previous calendar day", () => {
    expect(previousDateKey("2026-03-01")).toBe("2026-02-28");
  });
});

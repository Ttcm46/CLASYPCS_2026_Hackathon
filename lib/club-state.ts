import { cookies } from "next/headers";
import type { GameSession, Player } from "@/lib/db/schema";

export const PLAYER_COOKIE = "club_player_id";
export const STATE_COOKIE = "club_state";

export type ClubAnswer = {
  id: string;
  sessionId: string;
  questionId: string;
  attemptNumber: number;
  optionId: string;
  isCorrect: boolean;
  responseStartedAt: string;
  respondedAt: string;
  pointsEarned: number;
};

export type ClubState = {
  player: Player | null;
  sessions: GameSession[];
  answers: ClubAnswer[];
};

const emptyState = (): ClubState => ({
  player: null,
  sessions: [],
  answers: [],
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  secure: process.env.VERCEL === "1",
};

export async function readClubState(): Promise<ClubState> {
  const store = await cookies();
  const raw = store.get(STATE_COOKIE)?.value;
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw) as ClubState;
    return {
      player: parsed.player ?? null,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      answers: Array.isArray(parsed.answers) ? parsed.answers : [],
    };
  } catch {
    return emptyState();
  }
}

export async function writeClubState(state: ClubState) {
  const openIds = new Set(
    state.sessions
      .filter((session) => session.status === "reading" || session.status === "question")
      .map((session) => session.id),
  );
  const compact: ClubState = {
    player: state.player,
    sessions: state.sessions,
    answers: state.answers.filter((answer) => openIds.has(answer.sessionId)),
  };

  const store = await cookies();
  store.set(STATE_COOKIE, JSON.stringify(compact), cookieOptions);
  if (compact.player) {
    store.set(PLAYER_COOKIE, compact.player.id, cookieOptions);
  } else {
    store.delete(PLAYER_COOKIE);
    store.delete(STATE_COOKIE);
  }
}

export async function updateClubState(
  updater: (state: ClubState) => void,
): Promise<ClubState> {
  const state = await readClubState();
  updater(state);
  await writeClubState(state);
  return state;
}

export function newPlayer(input: {
  id: string;
  displayName: string;
  ageBand: string;
}): Player {
  return {
    id: input.id,
    displayName: input.displayName,
    ageBand: input.ageBand,
    timezone: "America/Mexico_City",
    createdAt: new Date().toISOString(),
    streakCurrent: 0,
    streakLastActiveDate: null,
    streakBonusesClaimed: "[]",
    casesCompletedToday: 0,
    casesCompletedTodayDate: null,
    isBot: false,
  };
}

export function newSession(input: {
  id: string;
  playerId: string;
  caseId: string;
  readingStartedAt: string;
}): GameSession {
  return {
    id: input.id,
    playerId: input.playerId,
    caseId: input.caseId,
    status: "reading",
    currentQuestionIndex: 0,
    questionStartedAt: null,
    readingStartedAt: input.readingStartedAt,
    readingCompletedAt: null,
    minReadingMet: false,
    readingWpm: null,
    firstAttemptCorrectCount: 0,
    questionPoints: 0,
    speedBonusPoints: 0,
    caseBonusPoints: 0,
    streakBonusPoints: 0,
    totalPoints: 0,
    countsForWeeklyRanking: true,
    completedAt: null,
  };
}

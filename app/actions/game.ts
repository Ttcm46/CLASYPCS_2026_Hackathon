"use server";

import {
  getCaseWithAuthor,
  getOptionById,
  getQuestionById,
  getQuestionsForCase,
} from "@/lib/catalog";
import {
  newSession,
  readClubState,
  updateClubState,
  type ClubAnswer,
} from "@/lib/club-state";
import { getCurrentPlayer } from "@/lib/player";
import { getPlayerRank, publicQuestion } from "@/lib/queries";
import {
  caseCleanBonus,
  countsForWeeklyRanking,
  isSpeedBonusEligible,
  scoreQuestion,
  streakBonusForDay,
  toDateKey,
  updateStreak,
  type AgeBand,
} from "@/lib/scoring/engine";
import type { GameSession } from "@/lib/db/schema";

function nowIso() {
  return new Date().toISOString();
}

function dailyFirstAttemptAccuracy(
  sessions: GameSession[],
  today: string,
): number | null {
  const todaySessions = sessions.filter(
    (session) =>
      session.status === "completed" &&
      session.completedAt &&
      toDateKey(new Date(session.completedAt)) === today,
  );
  if (todaySessions.length === 0) return null;
  const hits = todaySessions.reduce(
    (sum, session) => sum + session.firstAttemptCorrectCount,
    0,
  );
  return hits / (todaySessions.length * 3);
}

export async function startSession(caseId: string) {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Necesitas un nombre de detective." };

  const caseRow = getCaseWithAuthor(caseId);
  if (!caseRow) return { error: "Ese caso no existe." };
  if (caseRow.ageBand !== player.ageBand) {
    return { error: "Este caso es de otra banda de edad." };
  }

  const state = await readClubState();
  const openSession = state.sessions.find(
    (session) =>
      session.playerId === player.id &&
      session.caseId === caseId &&
      (session.status === "reading" || session.status === "question"),
  );

  if (openSession) {
    return {
      sessionId: openSession.id,
      minReadingSeconds: caseRow.minReadingSeconds,
      readingStartedAt: openSession.readingStartedAt,
      status: openSession.status,
    };
  }

  const id = crypto.randomUUID();
  const readingStartedAt = nowIso();
  await updateClubState((current) => {
    current.sessions.push(
      newSession({
        id,
        playerId: player.id,
        caseId,
        readingStartedAt,
      }),
    );
  });

  return {
    sessionId: id,
    minReadingSeconds: caseRow.minReadingSeconds,
    readingStartedAt,
    status: "reading" as const,
  };
}

export async function completeReading(
  sessionId: string,
  payload?: { wpm?: number; wordsPresented?: number },
) {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Sesión no encontrada." };

  const state = await readClubState();
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session || session.playerId !== player.id) {
    return { error: "Sesión no encontrada." };
  }
  if (session.status !== "reading") {
    return { error: "Esta investigación ya pasó la lectura." };
  }

  const caseRow = getCaseWithAuthor(session.caseId);
  if (!caseRow) return { error: "Caso no encontrado." };

  const elapsedMs = Date.now() - new Date(session.readingStartedAt).getTime();
  const presentedAll =
    typeof payload?.wordsPresented === "number" &&
    payload.wordsPresented >= caseRow.wordCount;
  const minReadingMet =
    presentedAll || elapsedMs >= caseRow.minReadingSeconds * 1000;
  const startedAt = nowIso();

  await updateClubState((current) => {
    const target = current.sessions.find((item) => item.id === sessionId);
    if (!target) return;
    target.status = "question";
    target.readingCompletedAt = startedAt;
    target.minReadingMet = minReadingMet;
    target.readingWpm =
      typeof payload?.wpm === "number" ? Math.round(payload.wpm) : null;
    target.currentQuestionIndex = 0;
    target.questionStartedAt = startedAt;
  });

  const [first] = getQuestionsForCase(session.caseId);
  return {
    minReadingMet,
    question: publicQuestion(first),
    questionStartedAt: startedAt,
    totalQuestions: 3,
  };
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  optionId: string,
): Promise<{
  error?: string;
  isCorrect?: boolean;
  explanation?: string | null;
  attemptNumber?: 1 | 2;
  canRetry?: boolean;
  finished?: boolean;
  basePoints?: number;
  points?: number;
  speedMultiplier?: number;
  speedBonus?: number;
  readingSkipPenalty?: boolean;
  readingWpm?: number | null;
  nextQuestion?: ReturnType<typeof publicQuestion> & {
    questionStartedAt: string;
  } | null;
}> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Sesión no encontrada." };

  const state = await readClubState();
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session || session.playerId !== player.id || session.status !== "question") {
    return { error: "Esta pregunta ya no está abierta." };
  }

  const question = getQuestionById(questionId);
  if (!question || question.caseId !== session.caseId) {
    return { error: "Esa pista no pertenece a este caso." };
  }

  const caseQuestions = getQuestionsForCase(session.caseId);
  const expected = caseQuestions[session.currentQuestionIndex];
  if (!expected || expected.id !== questionId) {
    return { error: "Todavía no toca esa pista." };
  }

  const option = getOptionById(optionId);
  if (!option || option.questionId !== questionId) {
    return { error: "Esa opción no existe." };
  }

  const previousAttempts = state.answers.filter(
    (answer) => answer.sessionId === sessionId && answer.questionId === questionId,
  );
  if (previousAttempts.length >= 2) {
    return { error: "Ya usaste tus dos intentos." };
  }
  if (previousAttempts.some((attempt) => attempt.isCorrect)) {
    return { error: "Esta pista ya está resuelta." };
  }

  const attemptNumber = (previousAttempts.length + 1) as 1 | 2;
  const respondedAt = nowIso();
  const responseStartedAt = session.questionStartedAt ?? respondedAt;
  const responseMs = Math.max(
    0,
    new Date(respondedAt).getTime() - new Date(responseStartedAt).getTime(),
  );

  const today = toDateKey(new Date());
  const score = scoreQuestion({
    isCorrect: option.isCorrect,
    attemptNumber,
    minReadingMet: session.minReadingMet,
    responseMs,
    speedBonusEligible: isSpeedBonusEligible(
      dailyFirstAttemptAccuracy(state.sessions, today),
    ),
    readingWpm: session.readingWpm ?? undefined,
  });

  const answer: ClubAnswer = {
    id: crypto.randomUUID(),
    sessionId,
    questionId,
    attemptNumber,
    optionId,
    isCorrect: option.isCorrect,
    responseStartedAt,
    respondedAt,
    pointsEarned: score.points,
  };

  const firstAttemptCorrectCount =
    session.firstAttemptCorrectCount +
    (option.isCorrect && attemptNumber === 1 ? 1 : 0);
  const canRetry = !option.isCorrect && attemptNumber === 1;
  const isLastQuestion = session.currentQuestionIndex >= caseQuestions.length - 1;
  const questionClosed = option.isCorrect || attemptNumber === 2;
  let nextStartedAt: string | null = null;
  let nextIndex = session.currentQuestionIndex;

  if (questionClosed && !isLastQuestion) {
    nextIndex = session.currentQuestionIndex + 1;
    nextStartedAt = nowIso();
  }

  await updateClubState((current) => {
    current.answers.push(answer);
    const target = current.sessions.find((item) => item.id === sessionId);
    if (!target) return;
    target.firstAttemptCorrectCount = firstAttemptCorrectCount;
    target.questionPoints = target.questionPoints + score.basePoints;
    target.speedBonusPoints = target.speedBonusPoints + score.speedBonus;
    if (nextStartedAt) {
      target.currentQuestionIndex = nextIndex;
      target.questionStartedAt = nextStartedAt;
    }
  });

  const nextQuestion =
    nextStartedAt && caseQuestions[nextIndex]
      ? {
          ...publicQuestion(caseQuestions[nextIndex]),
          questionStartedAt: nextStartedAt,
        }
      : null;

  return {
    isCorrect: option.isCorrect,
    explanation: question.explanation,
    attemptNumber,
    canRetry,
    finished: questionClosed && isLastQuestion,
    basePoints: score.basePoints,
    points: score.points,
    speedMultiplier: score.speedMultiplier,
    speedBonus: score.speedBonus,
    readingSkipPenalty: score.readingSkipPenalty,
    readingWpm: session.readingWpm,
    nextQuestion,
  };
}

export async function finishSession(sessionId: string): Promise<{
  error?: string;
  questionPoints?: number;
  speedBonusPoints?: number;
  caseBonusPoints?: number;
  streakBonusPoints?: number;
  totalPoints?: number;
  firstAttemptCorrectCount?: number;
  countsForWeeklyRanking?: boolean;
  minReadingMet?: boolean;
  readingWpm?: number | null;
  rank?: number | null;
  pointsToTop10?: number;
}> {
  const player = await getCurrentPlayer();
  if (!player) return { error: "Sesión no encontrada." };

  const state = await readClubState();
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session || session.playerId !== player.id) {
    return { error: "Sesión no encontrada." };
  }
  if (session.status === "completed") {
    return summarize(session, player.ageBand as AgeBand, player.id);
  }
  if (session.status !== "question") {
    return { error: "Todavía no puedes cerrar este caso." };
  }

  const caseQuestions = getQuestionsForCase(session.caseId);
  const answered = state.answers.filter((answer) => answer.sessionId === sessionId);
  const resolvedQuestions = new Set(
    answered
      .filter((answer) => answer.isCorrect || answer.attemptNumber === 2)
      .map((answer) => answer.questionId),
  );
  if (resolvedQuestions.size < caseQuestions.length) {
    return { error: "Aún faltan pistas por resolver." };
  }

  const today = toDateKey(new Date());
  const casesToday =
    player.casesCompletedTodayDate === today ? player.casesCompletedToday : 0;
  const counts = countsForWeeklyRanking(casesToday);
  const caseBonus = caseCleanBonus(session.firstAttemptCorrectCount);

  const streak = updateStreak({
    lastActiveDate: player.streakLastActiveDate,
    today,
    currentStreak: player.streakCurrent,
  });
  const claimed = JSON.parse(player.streakBonusesClaimed) as number[];
  const streakBonus = streak.alreadyCountedToday
    ? 0
    : streakBonusForDay(streak.streak, claimed);
  if (streakBonus > 0) claimed.push(streak.streak);

  const totalPoints =
    session.questionPoints +
    session.speedBonusPoints +
    caseBonus +
    streakBonus;
  const completedAt = nowIso();

  const updated = await updateClubState((current) => {
    const target = current.sessions.find((item) => item.id === sessionId);
    if (target) {
      target.status = "completed";
      target.caseBonusPoints = caseBonus;
      target.streakBonusPoints = streakBonus;
      target.totalPoints = totalPoints;
      target.countsForWeeklyRanking = counts;
      target.completedAt = completedAt;
    }
    if (current.player) {
      current.player.streakCurrent = streak.streak;
      current.player.streakLastActiveDate = today;
      current.player.streakBonusesClaimed = JSON.stringify(claimed);
      current.player.casesCompletedToday = casesToday + 1;
      current.player.casesCompletedTodayDate = today;
    }
  });

  const closed = updated.sessions.find((item) => item.id === sessionId);
  if (!closed) return { error: "Sesión no encontrada." };
  return summarize(closed, player.ageBand as AgeBand, player.id);
}

async function summarize(
  session: GameSession,
  ageBand: AgeBand,
  playerId: string,
) {
  const rank = await getPlayerRank(playerId, ageBand);
  return {
    questionPoints: session.questionPoints,
    speedBonusPoints: session.speedBonusPoints,
    caseBonusPoints: session.caseBonusPoints,
    streakBonusPoints: session.streakBonusPoints,
    totalPoints: session.totalPoints,
    firstAttemptCorrectCount: session.firstAttemptCorrectCount,
    countsForWeeklyRanking: session.countsForWeeklyRanking,
    minReadingMet: session.minReadingMet,
    readingWpm: session.readingWpm,
    rank: rank.row?.rank ?? null,
    pointsToTop10: rank.pointsToTop10,
  };
}

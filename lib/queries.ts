import type { GameSession, Player } from "@/lib/db/schema";
import {
  getAuthor,
  getCaseWithAuthor as catalogCase,
  seedBots,
} from "@/lib/catalog";
import { readClubState } from "@/lib/club-state";
import {
  medalLevel,
  nextMedal,
  startOfWeek,
  type AgeBand,
} from "@/lib/scoring/engine";

export { getCaseWithAuthor, getQuestionsForCase, listCasesForBand } from "@/lib/catalog";

export function publicQuestion(question: {
  id: string;
  order: number;
  promptText: string;
  options: { id: string; label: string }[];
}) {
  return {
    id: question.id,
    order: question.order,
    promptText: question.promptText,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
    })),
  };
}

export type LeaderboardRow = {
  playerId: string;
  displayName: string;
  isBot: boolean;
  totalPoints: number;
  casesCompleted: number;
  firstAttemptAccuracy: number;
  rank: number;
};

function isoDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

export async function getCurrentPlayerRecord(): Promise<Player | null> {
  const state = await readClubState();
  return state.player;
}

export async function getWeeklyLeaderboard(ageBand: AgeBand): Promise<LeaderboardRow[]> {
  const weekStart = startOfWeek().toISOString();
  const state = await readClubState();
  const byPlayer = new Map<
    string,
    {
      playerId: string;
      displayName: string;
      isBot: boolean;
      totalPoints: number;
      casesCompleted: number;
      firstAttemptHits: number;
    }
  >();

  function addSession(
    playerId: string,
    displayName: string,
    isBot: boolean,
    totalPoints: number,
    firstAttemptHits: number,
  ) {
    const current = byPlayer.get(playerId) ?? {
      playerId,
      displayName,
      isBot,
      totalPoints: 0,
      casesCompleted: 0,
      firstAttemptHits: 0,
    };
    current.totalPoints += totalPoints;
    current.casesCompleted += 1;
    current.firstAttemptHits += firstAttemptHits;
    byPlayer.set(playerId, current);
  }

  for (const bot of seedBots()) {
    if (bot.ageBand !== ageBand) continue;
    for (const session of bot.sessions) {
      const completedAt = isoDaysAgo(session.daysAgo);
      if (completedAt < weekStart) continue;
      addSession(
        bot.id,
        bot.displayName,
        true,
        session.totalPoints,
        session.firstAttemptCorrectCount,
      );
    }
  }

  if (state.player && state.player.ageBand === ageBand) {
    for (const session of state.sessions) {
      if (session.status !== "completed") continue;
      if (!session.countsForWeeklyRanking || !session.completedAt) continue;
      if (session.completedAt < weekStart) continue;
      addSession(
        state.player.id,
        state.player.displayName,
        false,
        session.totalPoints,
        session.firstAttemptCorrectCount,
      );
    }
  }

  return [...byPlayer.values()]
    .map((row) => ({
      ...row,
      firstAttemptAccuracy:
        row.casesCompleted === 0
          ? 0
          : row.firstAttemptHits / (row.casesCompleted * 3),
    }))
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.casesCompleted !== a.casesCompleted) {
        return b.casesCompleted - a.casesCompleted;
      }
      return b.firstAttemptAccuracy - a.firstAttemptAccuracy;
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function getPlayerRank(playerId: string, ageBand: AgeBand) {
  const board = await getWeeklyLeaderboard(ageBand);
  const row = board.find((entry) => entry.playerId === playerId);
  const tenth = board[9];
  return {
    board,
    row: row ?? null,
    pointsToTop10:
      row && row.rank > 10 && tenth
        ? tenth.totalPoints - row.totalPoints + 1
        : 0,
  };
}

export async function getProfileStats(player: Player) {
  const state = await readClubState();
  const completed = state.sessions
    .filter((session) => session.status === "completed")
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));

  const weekStart = startOfWeek().toISOString();
  const weeklyPoints = completed
    .filter(
      (session) =>
        session.countsForWeeklyRanking &&
        session.completedAt &&
        session.completedAt >= weekStart,
    )
    .reduce((sum, session) => sum + session.totalPoints, 0);

  const byAuthor = new Map<string, { name: string; count: number }>();
  for (const session of completed) {
    const caseRow = catalogCase(session.caseId);
    if (!caseRow) continue;
    const author = getAuthor(caseRow.authorId);
    const current = byAuthor.get(caseRow.authorId) ?? {
      name: author?.name ?? caseRow.authorName,
      count: 0,
    };
    current.count += 1;
    byAuthor.set(caseRow.authorId, current);
  }

  const medals = [...byAuthor.entries()].map(([authorId, info]) => ({
    authorId,
    authorName: info.name,
    casesCompleted: info.count,
    level: medalLevel(info.count),
    next: nextMedal(info.count),
  }));

  return {
    casesCompleted: completed.length,
    weeklyPoints,
    streak: player.streakCurrent,
    medals,
  };
}

export async function completedCaseIds(playerId: string): Promise<string[]> {
  const state = await readClubState();
  if (state.player?.id !== playerId) return [];
  return state.sessions
    .filter((session) => session.status === "completed")
    .map((session: GameSession) => session.caseId);
}

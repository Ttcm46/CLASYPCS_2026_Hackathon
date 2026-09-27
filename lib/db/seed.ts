import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import seedData from "../../data/seed-cases.json";
import { countWords, minReadingSeconds } from "../scoring/engine";
import * as schema from "./schema";
import { authors, cases, gameSessions, options, players, questions } from "./schema";

type Db = BetterSQLite3Database<typeof schema>;

function isoDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

export function seedDatabase(db: Db) {
  for (const author of seedData.authors) {
    const exists = db.select().from(authors).where(eq(authors.id, author.id)).get();
    if (exists) continue;
    db.insert(authors)
      .values({
        id: author.id,
        name: author.name,
        category: author.category,
        country: author.country,
      })
      .run();
  }

  for (const caseItem of seedData.cases) {
    const exists = db.select().from(cases).where(eq(cases.id, caseItem.id)).get();
    if (exists) continue;
    const wordCount = countWords(caseItem.fragmentText);
    db.insert(cases)
      .values({
        id: caseItem.id,
        authorId: caseItem.authorId,
        ageBand: caseItem.ageBand,
        title: caseItem.title,
        fragmentText: caseItem.fragmentText,
        wordCount,
        minReadingSeconds: minReadingSeconds(wordCount),
      })
      .run();

    for (const question of caseItem.questions) {
      db.insert(questions)
        .values({
          id: question.id,
          caseId: caseItem.id,
          order: question.order,
          promptText: question.promptText,
          explanation: question.explanation,
        })
        .run();

      for (const option of question.options) {
        db.insert(options)
          .values({
            id: option.id,
            questionId: question.id,
            label: option.label,
            isCorrect: option.isCorrect,
          })
          .run();
      }
    }
  }

  for (const bot of seedData.bots) {
    const exists = db.select().from(players).where(eq(players.id, bot.id)).get();
    if (exists) continue;
    db.insert(players)
      .values({
        id: bot.id,
        displayName: bot.displayName,
        ageBand: bot.ageBand,
        createdAt: isoDaysAgo(7),
        isBot: true,
        streakCurrent: bot.sessions.length,
        streakLastActiveDate: isoDaysAgo(bot.sessions[0]?.daysAgo ?? 0).slice(
          0,
          10,
        ),
      })
      .run();

    for (const session of bot.sessions) {
      const completedAt = isoDaysAgo(session.daysAgo);
      db.insert(gameSessions)
        .values({
          id: `${bot.id}-${session.caseId}`,
          playerId: bot.id,
          caseId: session.caseId,
          status: "completed",
          currentQuestionIndex: 3,
          readingStartedAt: completedAt,
          readingCompletedAt: completedAt,
          minReadingMet: true,
          firstAttemptCorrectCount: session.firstAttemptCorrectCount,
          questionPoints: session.totalPoints,
          totalPoints: session.totalPoints,
          countsForWeeklyRanking: true,
          completedAt,
        })
        .run();
    }
  }
}

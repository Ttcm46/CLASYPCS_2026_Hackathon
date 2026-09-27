import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  ageBand: text("age_band").notNull(),
  timezone: text("timezone").notNull().default("America/Mexico_City"),
  createdAt: text("created_at").notNull(),
  streakCurrent: integer("streak_current").notNull().default(0),
  streakLastActiveDate: text("streak_last_active_date"),
  streakBonusesClaimed: text("streak_bonuses_claimed").notNull().default("[]"),
  casesCompletedToday: integer("cases_completed_today").notNull().default(0),
  casesCompletedTodayDate: text("cases_completed_today_date"),
  isBot: integer("is_bot", { mode: "boolean" }).notNull().default(false),
});

export const authors = sqliteTable("authors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  country: text("country"),
});

export const cases = sqliteTable("cases", {
  id: text("id").primaryKey(),
  authorId: text("author_id")
    .notNull()
    .references(() => authors.id),
  ageBand: text("age_band").notNull(),
  title: text("title").notNull(),
  fragmentText: text("fragment_text").notNull(),
  wordCount: integer("word_count").notNull(),
  minReadingSeconds: integer("min_reading_seconds").notNull(),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  caseId: text("case_id")
    .notNull()
    .references(() => cases.id),
  order: integer("sort_order").notNull(),
  promptText: text("prompt_text").notNull(),
  explanation: text("explanation"),
});

export const options = sqliteTable("options", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id),
  label: text("label").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
});

export const gameSessions = sqliteTable("game_sessions", {
  id: text("id").primaryKey(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id),
  caseId: text("case_id")
    .notNull()
    .references(() => cases.id),
  status: text("status").notNull(),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  questionStartedAt: text("question_started_at"),
  readingStartedAt: text("reading_started_at").notNull(),
  readingCompletedAt: text("reading_completed_at"),
  minReadingMet: integer("min_reading_met", { mode: "boolean" })
    .notNull()
    .default(false),
  readingWpm: integer("reading_wpm"),
  firstAttemptCorrectCount: integer("first_attempt_correct_count")
    .notNull()
    .default(0),
  questionPoints: integer("question_points").notNull().default(0),
  speedBonusPoints: integer("speed_bonus_points").notNull().default(0),
  caseBonusPoints: integer("case_bonus_points").notNull().default(0),
  streakBonusPoints: integer("streak_bonus_points").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  countsForWeeklyRanking: integer("counts_for_weekly_ranking", {
    mode: "boolean",
  })
    .notNull()
    .default(true),
  completedAt: text("completed_at"),
});

export const answers = sqliteTable("answers", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => gameSessions.id),
  questionId: text("question_id").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  optionId: text("option_id").notNull(),
  isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
  responseStartedAt: text("response_started_at").notNull(),
  respondedAt: text("responded_at").notNull(),
  pointsEarned: integer("points_earned").notNull(),
});

export type Player = typeof players.$inferSelect;
export type CaseRow = typeof cases.$inferSelect;
export type Author = typeof authors.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Option = typeof options.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;

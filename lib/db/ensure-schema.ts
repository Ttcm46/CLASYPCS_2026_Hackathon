import type Database from "better-sqlite3";

export function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      age_band TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
      created_at TEXT NOT NULL,
      streak_current INTEGER NOT NULL DEFAULT 0,
      streak_last_active_date TEXT,
      streak_bonuses_claimed TEXT NOT NULL DEFAULT '[]',
      cases_completed_today INTEGER NOT NULL DEFAULT 0,
      cases_completed_today_date TEXT,
      is_bot INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      country TEXT
    );

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL REFERENCES authors(id),
      age_band TEXT NOT NULL,
      title TEXT NOT NULL,
      fragment_text TEXT NOT NULL,
      word_count INTEGER NOT NULL,
      min_reading_seconds INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES cases(id),
      sort_order INTEGER NOT NULL,
      prompt_text TEXT NOT NULL,
      explanation TEXT
    );

    CREATE TABLE IF NOT EXISTS options (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL REFERENCES questions(id),
      label TEXT NOT NULL,
      is_correct INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES players(id),
      case_id TEXT NOT NULL REFERENCES cases(id),
      status TEXT NOT NULL,
      current_question_index INTEGER NOT NULL DEFAULT 0,
      question_started_at TEXT,
      reading_started_at TEXT NOT NULL,
      reading_completed_at TEXT,
      min_reading_met INTEGER NOT NULL DEFAULT 0,
      reading_wpm INTEGER,
      first_attempt_correct_count INTEGER NOT NULL DEFAULT 0,
      question_points INTEGER NOT NULL DEFAULT 0,
      speed_bonus_points INTEGER NOT NULL DEFAULT 0,
      case_bonus_points INTEGER NOT NULL DEFAULT 0,
      streak_bonus_points INTEGER NOT NULL DEFAULT 0,
      total_points INTEGER NOT NULL DEFAULT 0,
      counts_for_weekly_ranking INTEGER NOT NULL DEFAULT 1,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES game_sessions(id),
      question_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      option_id TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      response_started_at TEXT NOT NULL,
      responded_at TEXT NOT NULL,
      points_earned INTEGER NOT NULL
    );
  `);

  const sessionColumns = sqlite
    .prepare("PRAGMA table_info(game_sessions)")
    .all() as { name: string }[];
  if (!sessionColumns.some((column) => column.name === "reading_wpm")) {
    sqlite.exec("ALTER TABLE game_sessions ADD COLUMN reading_wpm INTEGER");
  }
}

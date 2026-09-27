import Link from "next/link";
import { BookMascot } from "@/components/book-mascot";
import { duoButtonClass } from "@/components/duo-button";
import { formatMultiplier } from "@/lib/scoring/engine";

export type ScoreBreakdown = {
  questionPoints: number;
  speedBonusPoints: number;
  caseBonusPoints: number;
  streakBonusPoints: number;
  totalPoints: number;
  firstAttemptCorrectCount: number;
  countsForWeeklyRanking: boolean;
  minReadingMet: boolean;
  readingWpm: number | null;
  rank: number | null;
  pointsToTop10: number;
};

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

export function ScoreSummary({ summary }: { summary: ScoreBreakdown }) {
  const awardedQuestionPoints =
    summary.questionPoints + summary.speedBonusPoints;
  const speedMultiplier =
    summary.questionPoints > 0
      ? Math.round((awardedQuestionPoints / summary.questionPoints) * 100) / 100
      : 1;
  const speedLabel = [
    "Velocidad",
    speedMultiplier !== 1 ? formatMultiplier(speedMultiplier) : null,
    summary.readingWpm ? `(${summary.readingWpm} ppm)` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const rows = [
    { label: "Aciertos", value: summary.questionPoints },
    { label: speedLabel, value: summary.speedBonusPoints },
    { label: "Caso limpio", value: summary.caseBonusPoints },
    { label: "Racha", value: summary.streakBonusPoints },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
      <BookMascot size={110} mood="wow" />
      <h1 className="mt-4 text-3xl font-extrabold text-[#1E4B8E]">
        ¡Lección completada!
      </h1>
      <p className="mt-2 font-semibold text-[#5B6B86]">
        {summary.firstAttemptCorrectCount} de 3 al primer intento
      </p>
      <p className="mt-4 text-6xl font-extrabold text-[#C41E3A] tabular-nums">
        +{summary.totalPoints}
      </p>
      <ul className="mt-5 w-full max-w-sm space-y-2 text-sm font-bold">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex justify-between rounded-2xl bg-white px-4 py-3 shadow-[0_2px_0_#D6DEEE]"
          >
            <span>{row.label}</span>
            <span className="text-[#1E4B8E]">{formatSigned(row.value)}</span>
          </li>
        ))}
      </ul>
      {!summary.minReadingMet ? (
        <p className="mt-4 text-sm font-semibold text-[#C41E3A]">
          No se mostraron todas las palabras: menos puntos y sin multiplicador
          de velocidad.
        </p>
      ) : summary.readingWpm ? (
        <p className="mt-4 text-sm font-semibold text-[#1E4B8E]">
          Tus puntos se multiplicaron por la velocidad de lectura y de
          respuesta.
        </p>
      ) : null}
      {!summary.countsForWeeklyRanking ? (
        <p className="mt-2 text-sm font-semibold text-[#5B6B86]">
          Ya llevas 8 casos hoy: esto suma a medallas, no a la liga.
        </p>
      ) : null}
      {summary.rank ? (
        <p className="mt-3 text-sm font-bold text-[#1E4B8E]">
          Vas #{summary.rank} en la liga
          {summary.pointsToTop10 > 0
            ? ` · ${summary.pointsToTop10} pts para el top 10`
            : ""}
        </p>
      ) : null}
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <Link href="/inicio" className={duoButtonClass("blue", "w-full")}>
          Seguir el tren
        </Link>
        <Link href="/ranking" className={duoButtonClass("white", "w-full")}>
          Ver la liga
        </Link>
      </div>
    </div>
  );
}

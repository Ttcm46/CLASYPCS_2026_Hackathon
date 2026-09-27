import { bandAlias } from "@/lib/bands";
import { getCurrentPlayer } from "@/lib/player";
import { getPlayerRank } from "@/lib/queries";
import type { AgeBand } from "@/lib/scoring/engine";
import { cn } from "@/lib/utils";

export default async function RankingPage() {
  const player = await getCurrentPlayer();
  if (!player) return null;

  const { board, row, pointsToTop10 } = await getPlayerRank(
    player.id,
    player.ageBand as AgeBand,
  );
  const top = board.slice(0, 10);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#1E4B8E] px-5 py-5 text-white shadow-[0_4px_0_#143262]">
        <p className="text-xs font-extrabold tracking-[0.18em] uppercase">
          Liga semanal · {bandAlias(player.ageBand)}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold">Tabla de detectives</h1>
        <p className="mt-2 text-sm font-semibold text-white/90">
          {row
            ? `Vas #${row.rank} con ${row.totalPoints} XP${
                pointsToTop10 > 0 ? ` · ${pointsToTop10} para el top 10` : ""
              }`
            : "Cierra un vagón para entrar a la liga."}
        </p>
      </div>

      <ol className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_0_#D6DEEE]">
        {top.length === 0 ? (
          <li className="px-4 py-8 text-center font-semibold text-[#5B6B86]">
            La liga todavía está vacía.
          </li>
        ) : (
          top.map((entry, index) => {
            const mine = entry.playerId === player.id;
            return (
              <li
                key={entry.playerId}
                className={cn(
                  "flex items-center gap-3 border-b border-[#D6DEEE] px-4 py-3 last:border-b-0",
                  mine && "bg-[#FDE8EA]",
                )}
              >
                <span
                  className={cn(
                    "w-7 text-center text-lg font-extrabold",
                    index === 0 && "text-[#C41E3A]",
                    index === 1 && "text-[#1E4B8E]",
                    index === 2 && "text-[#5B6B86]",
                  )}
                >
                  {entry.rank}
                </span>
                <span className="flex size-10 items-center justify-center rounded-full bg-[#E8EEF8] text-sm font-extrabold text-[#1E4B8E]">
                  {entry.displayName.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold">{entry.displayName}</p>
                  <p className="text-xs font-semibold text-[#5B6B86]">
                    {entry.casesCompleted} lecturas ·{" "}
                    {Math.round(entry.firstAttemptAccuracy * 100)}% primer
                    intento
                  </p>
                </div>
                <span className="font-extrabold text-[#C41E3A] tabular-nums">
                  {entry.totalPoints} XP
                </span>
              </li>
            );
          })
        )}
      </ol>
    </div>
  );
}

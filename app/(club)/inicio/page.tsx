import { ReadingPath } from "@/components/reading-path";
import { getCurrentPlayer } from "@/lib/player";
import { completedCaseIds, listCasesForBand } from "@/lib/queries";
import type { AgeBand } from "@/lib/scoring/engine";

export default async function InicioPage() {
  const player = await getCurrentPlayer();
  if (!player) return null;

  const ageBand = player.ageBand as AgeBand;
  const cases = listCasesForBand(ageBand);
  const done = new Set(await completedCaseIds(player.id));

  return (
    <div className="space-y-2">
      <p className="text-center text-sm font-extrabold text-[#1E4B8E]">
        Hola, {player.displayName}. Folio espera en tu tren de lecturas.
      </p>
      <ReadingPath ageBand={ageBand} cases={cases} completedIds={done} />
    </div>
  );
}

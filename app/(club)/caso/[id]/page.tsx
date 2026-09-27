import Link from "next/link";
import { notFound } from "next/navigation";
import { CasePlay } from "@/components/case-play";
import { duoButtonClass } from "@/components/duo-button";
import { getCurrentPlayer } from "@/lib/player";
import { completedCaseIds, getCaseWithAuthor } from "@/lib/queries";
import { isCaseUnlocked } from "@/lib/reading-path";
import type { AgeBand } from "@/lib/scoring/engine";

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const player = await getCurrentPlayer();
  if (!player) return null;

  const { id } = await params;
  const caseRow = getCaseWithAuthor(id);
  if (!caseRow || caseRow.ageBand !== player.ageBand) notFound();

  const unlocked = isCaseUnlocked(
    caseRow.id,
    player.ageBand as AgeBand,
    new Set(await completedCaseIds(player.id)),
  );

  if (!unlocked) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-[#E5E5E5] text-3xl shadow-[0_6px_0_#C4C4C4]">
          🔒
        </div>
        <h1 className="mt-5 text-2xl font-extrabold">Lección bloqueada</h1>
        <p className="mt-2 max-w-sm text-[#777]">
          Termina la lectura anterior de la ruta para abrir este caso.
        </p>
        <Link href="/inicio" className={duoButtonClass("blue", "mt-6")}>
          Volver al tren
        </Link>
      </div>
    );
  }

  return (
    <CasePlay
      caseId={caseRow.id}
      title={caseRow.title}
      fragmentText={caseRow.fragmentText}
      authorName={caseRow.authorName}
      authorCategory={caseRow.authorCategory}
      ageBand={player.ageBand as AgeBand}
    />
  );
}

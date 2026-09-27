import type { AgeBand } from "@/lib/scoring/engine";

export type PathNodeStatus = "completed" | "current" | "locked";

export type PathUnit = {
  id: string;
  title: string;
  description: string;
  accent: "green" | "blue";
  caseIds: string[];
};

export const READING_PATH: Record<AgeBand, PathUnit[]> = {
  "8-11": [
    {
      id: "ruta-primeros-casos",
      title: "Convoy 1",
      description: "El express de los primeros casos",
      accent: "green",
      caseIds: [
        "quijote-molinos",
        "volcanes-enamorados",
        "platero-luna",
        "maiz-sagrado",
      ],
    },
  ],
  "12-15": [
    {
      id: "ruta-astucia",
      title: "Convoy 1",
      description: "El express de las pistas largas",
      accent: "blue",
      caseIds: [
        "ulises-nadie",
        "fierro-frontera",
        "lazarillo-ciego",
        "sor-juana-verso",
      ],
    },
  ],
};

export function flattenPath(ageBand: AgeBand): string[] {
  return READING_PATH[ageBand].flatMap((unit) => unit.caseIds);
}

export function nodeStatus(
  caseId: string,
  ageBand: AgeBand,
  completedIds: Set<string>,
): PathNodeStatus {
  const order = flattenPath(ageBand);
  const index = order.indexOf(caseId);
  if (index === -1) return completedIds.has(caseId) ? "completed" : "locked";
  if (completedIds.has(caseId)) return "completed";
  const previous = order.slice(0, index);
  const allPreviousDone = previous.every((id) => completedIds.has(id));
  return allPreviousDone ? "current" : "locked";
}

export function isCaseUnlocked(
  caseId: string,
  ageBand: AgeBand,
  completedIds: Set<string>,
): boolean {
  const status = nodeStatus(caseId, ageBand, completedIds);
  return status === "current" || status === "completed";
}

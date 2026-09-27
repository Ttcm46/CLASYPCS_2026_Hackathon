import type { AgeBand } from "@/lib/scoring/engine";

export const BAND_ALIASES: Record<AgeBand, { alias: string; ages: string }> = {
  "8-11": { alias: "Junior", ages: "8 a 11 años" },
  "12-15": { alias: "Cadete", ages: "12 a 15 años" },
};

export function bandAlias(ageBand: string): string {
  if (ageBand === "8-11" || ageBand === "12-15") {
    return BAND_ALIASES[ageBand].alias;
  }
  return ageBand;
}

export function bandAges(ageBand: AgeBand): string {
  return BAND_ALIASES[ageBand].ages;
}

import { Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MedalLevel } from "@/lib/scoring/engine";

const copy: Record<Exclude<MedalLevel, "none">, string> = {
  bronze: "Bronce",
  silver: "Plata",
  gold: "Oro",
};

export function MedalBadge({
  level,
  authorName,
}: {
  level: MedalLevel;
  authorName: string;
}) {
  if (level === "none") return null;
  return (
    <Badge variant="secondary" className="h-7 gap-1.5 px-2.5">
      <Medal className="size-3.5" />
      {copy[level]} · {authorName}
    </Badge>
  );
}

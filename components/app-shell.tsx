import { Flame, Star } from "lucide-react";
import type { Player } from "@/lib/db/schema";
import { bandAlias } from "@/lib/bands";
import { BottomNav, SideNav } from "@/components/bottom-nav";
import { HideOnLesson } from "@/components/hide-on-lesson";

export function AppShell({
  player,
  weeklyPoints,
  children,
}: {
  player: Player;
  weeklyPoints: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full bg-white">
      <SideNav />
      <div className="flex min-h-full flex-1 flex-col">
        <HideOnLesson>
          <header className="sticky top-0 z-20 border-b-2 border-[#D6DEEE] bg-white">
            <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
              <span className="rounded-xl bg-[#C41E3A] px-3 py-1 text-xs font-extrabold tracking-wide text-white uppercase">
                {bandAlias(player.ageBand)}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-extrabold text-[#C41E3A]">
                <Flame className="size-5 fill-[#C41E3A] text-[#C41E3A]" />
                {player.streakCurrent}
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-extrabold text-[#1E4B8E]">
                <Star className="size-5 fill-[#1E4B8E] text-[#1E4B8E]" />
                {weeklyPoints}
              </span>
            </div>
          </header>
        </HideOnLesson>
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-5 pb-28 md:pb-10">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

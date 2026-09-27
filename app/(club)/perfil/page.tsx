import { Flame, Medal, Star } from "lucide-react";
import { signOut } from "@/app/actions/player";
import { BookMascot } from "@/components/book-mascot";
import { DuoButton } from "@/components/duo-button";
import { bandAlias } from "@/lib/bands";
import { getCurrentPlayer } from "@/lib/player";
import { getProfileStats } from "@/lib/queries";
import { MEDAL_THRESHOLDS } from "@/lib/scoring/engine";

export default async function PerfilPage() {
  const player = await getCurrentPlayer();
  if (!player) return null;
  const stats = await getProfileStats(player);

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center rounded-2xl bg-white px-5 py-8 shadow-[0_2px_0_#D6DEEE]">
        <BookMascot size={96} />
        <h1 className="mt-3 text-2xl font-extrabold text-[#1E4B8E]">
          {player.displayName}
        </h1>
        <p className="font-bold text-[#C41E3A]">{bandAlias(player.ageBand)}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Flame className="size-5 fill-[#C41E3A] text-[#C41E3A]" />}
          label="Racha"
          value={`${stats.streak}`}
        />
        <StatCard
          icon={<Star className="size-5 fill-[#1E4B8E] text-[#1E4B8E]" />}
          label="XP semana"
          value={`${stats.weeklyPoints}`}
        />
        <StatCard
          icon={<Medal className="size-5 text-[#C41E3A]" />}
          label="Casos"
          value={`${stats.casesCompleted}`}
        />
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-[0_2px_0_#D6DEEE]">
        <h2 className="text-lg font-extrabold text-[#1E4B8E]">Medallas de autor</h2>
        <p className="mt-1 text-sm font-semibold text-[#5B6B86]">
          No suman a la liga. Bronce 5 · Plata 15 · Oro 30.
        </p>
        <div className="mt-4 space-y-4">
          {stats.medals.length === 0 ? (
            <p className="text-sm font-semibold text-[#5B6B86]">
              Completa vagones del tren para empezar tu colección.
            </p>
          ) : (
            stats.medals.map((medal) => {
              const target =
                medal.level === "gold"
                  ? MEDAL_THRESHOLDS.gold
                  : medal.next
                    ? medal.casesCompleted + medal.next.remaining
                    : MEDAL_THRESHOLDS.gold;
              const value = Math.min(
                100,
                Math.round((medal.casesCompleted / target) * 100),
              );
              return (
                <div key={medal.authorId}>
                  <div className="mb-1 flex items-center justify-between text-sm font-extrabold">
                    <span>{medal.authorName}</span>
                    <span className="text-[#C41E3A]">
                      {medal.level === "none"
                        ? `${medal.casesCompleted}/${MEDAL_THRESHOLDS.bronze}`
                        : medal.level}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#E8EEF8]">
                    <div
                      className="h-full rounded-full bg-[#1E4B8E]"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <form action={signOut}>
        <DuoButton type="submit" tone="white" className="w-full">
          Cambiar de detective
        </DuoButton>
      </form>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-[0_2px_0_#D6DEEE]">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
      <p className="text-[11px] font-extrabold tracking-wide text-[#5B6B86] uppercase">
        {label}
      </p>
    </div>
  );
}

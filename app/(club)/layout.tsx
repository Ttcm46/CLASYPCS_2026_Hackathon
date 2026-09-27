import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentPlayer } from "@/lib/player";
import { getProfileStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const player = await getCurrentPlayer();
  if (!player) redirect("/");
  const stats = await getProfileStats(player);

  return (
    <AppShell player={player} weeklyPoints={stats.weeklyPoints}>
      {children}
    </AppShell>
  );
}

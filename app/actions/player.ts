"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  PLAYER_COOKIE,
  STATE_COOKIE,
  newPlayer,
  writeClubState,
} from "@/lib/club-state";
import type { AgeBand } from "@/lib/scoring/engine";

function isAgeBand(value: string): value is AgeBand {
  return value === "8-11" || value === "12-15";
}

export async function createPlayer(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const ageBand = String(formData.get("ageBand") ?? "");

  if (displayName.length < 2 || displayName.length > 24) {
    return { error: "Elige un nombre de detective de 2 a 24 letras." };
  }
  if (!isAgeBand(ageBand)) {
    return { error: "Elige Junior o Cadete para recibir casos a tu medida." };
  }

  const id = crypto.randomUUID();
  await writeClubState({
    player: newPlayer({ id, displayName, ageBand }),
    sessions: [],
    answers: [],
  });

  redirect("/inicio");
}

export async function signOut() {
  const store = await cookies();
  store.delete(PLAYER_COOKIE);
  store.delete(STATE_COOKIE);
  redirect("/");
}

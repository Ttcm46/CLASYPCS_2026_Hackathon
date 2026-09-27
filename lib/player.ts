import { readClubState } from "@/lib/club-state";

export { PLAYER_COOKIE } from "@/lib/club-state";

export async function getCurrentPlayer() {
  const state = await readClubState();
  return state.player;
}

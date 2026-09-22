import type { PlayerId } from "./types";
import { PLAYER_IDS } from "./types";

export const PLAYERS: { id: PlayerId; name: string }[] = PLAYER_IDS.map((id) => ({
  id,
  name: id
}));

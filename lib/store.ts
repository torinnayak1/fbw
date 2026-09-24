import { GAMES } from "./bracket";
import { supabaseServer } from "./supabase-server";
import {
  emptyPlayerPicks,
  PLAYER_IDS,
  type GameId,
  type PlayerId,
  type Picks,
  type Results,
  type StoreData
} from "./types";

const EMPTY: StoreData = {
  picks: emptyPlayerPicks(),
  results: {},
  updatedAt: new Date(0).toISOString()
};

const GAME_IDS = new Set<string>(GAMES.map((game) => game.id));

const WRITE_ROUND = "Round";
const WRITE_RESULTS = "Results";
const WRITE_PLAYERS: Record<PlayerId, string> = {
  R: "R",
  T: "T",
  S: "S",
  M: "M",
  B: "B",
  Tej: "Tej",
  Mamama: "Mamama",
  Kyla: "Kyla",
  Carly: "Carly"
};

function asRow(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

function lowerRow(row: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    next[key.toLowerCase()] = value;
  }
  return next;
}

function text(value: unknown): string | null {
  if (value == null) return null;
  const next = String(value).trim();
  return next.length ? next : null;
}

function asGameId(value: string | null): GameId | null {
  if (!value || !GAME_IDS.has(value)) return null;
  return value as GameId;
}

function asBearId(value: string | null): string | null {
  if (!value) return null;
  const digits = value.match(/^\d+/);
  return digits ? digits[0] : value;
}

function rowsToStore(rows: Record<string, unknown>[]): StoreData {
  const store: StoreData = {
    picks: emptyPlayerPicks(),
    results: {},
    updatedAt: new Date().toISOString()
  };
  for (const raw of rows) {
    const row = lowerRow(raw);
    const gameId = asGameId(text(row.round));
    if (!gameId) continue;
    for (const player of PLAYER_IDS) {
      const pick = asBearId(text(row[player.toLowerCase()]));
      if (pick) store.picks[player][gameId] = pick;
    }
    const official = asBearId(text(row.results));
    if (official) store.results[gameId] = official;
  }
  return store;
}

export async function readStore(): Promise<StoreData> {
  const { data, error } = await supabaseServer().from("picks").select("*");
  if (error) throw error;
  if (!data?.length) return EMPTY;
  return rowsToStore(data.map(asRow));
}

async function updateCell(
  column: string,
  gameId: GameId,
  value: string | null
): Promise<void> {
  const client = supabaseServer();
  const quoted = await client
    .from("picks")
    .update({ [column]: value })
    .eq(WRITE_ROUND, gameId)
    .select("*");
  if (!quoted.error && quoted.data?.length) return;
  const lower = await client
    .from("picks")
    .update({ [column.toLowerCase()]: value })
    .eq("round", gameId)
    .select("*");
  if (lower.error) throw lower.error;
  if (quoted.error && !lower.data?.length) throw quoted.error;
}

async function writeChangedCells(
  columnFor: (gameId: GameId) => string,
  next: Partial<Record<GameId, string | null>>,
  previous: Partial<Record<GameId, string>>
): Promise<void> {
  const updates = GAMES.filter((game) => (next[game.id] ?? null) !== (previous[game.id] ?? null)).map(
    (game) => updateCell(columnFor(game.id), game.id, next[game.id] ?? null)
  );
  await Promise.all(updates);
}

export async function savePicks(player: PlayerId, picks: Picks): Promise<StoreData> {
  const current = await readStore();
  await writeChangedCells(() => WRITE_PLAYERS[player], picks, current.picks[player]);
  return readStore();
}

export async function saveResults(results: Results): Promise<StoreData> {
  const current = await readStore();
  await writeChangedCells(() => WRITE_RESULTS, results, current.results);
  return readStore();
}

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

type Schema = {
  round: string;
  results: string;
  players: Record<PlayerId, string>;
};

type GlobalCache = typeof globalThis & { __fbwSchema?: Schema };

function cache(): GlobalCache {
  return globalThis as GlobalCache;
}

function asRow(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

function text(value: unknown): string | null {
  if (value == null) return null;
  const next = String(value).trim();
  return next.length ? next : null;
}

function quotedPlayers(): Record<PlayerId, string> {
  return {
    R: "R",
    T: "T",
    S: "S",
    M: "M",
    B: "B",
    Tej: "Tej",
    Mamama: "Mamama"
  };
}

function resolveKey(row: Record<string, unknown>, preferred: string): string {
  if (preferred in row) return preferred;
  const match = Object.keys(row).find(
    (key) => key.toLowerCase() === preferred.toLowerCase()
  );
  return match ?? preferred;
}

function lookup(row: Record<string, unknown>, key: string): unknown {
  if (key in row) return row[key];
  const match = Object.keys(row).find((item) => item.toLowerCase() === key.toLowerCase());
  return match ? row[match] : undefined;
}

async function detectSchema(): Promise<Schema> {
  if (cache().__fbwSchema) return cache().__fbwSchema as Schema;
  const quoted: Schema = {
    round: "Round",
    results: "Results",
    players: quotedPlayers()
  };
  const { data, error } = await supabaseServer().from("picks").select("*").limit(1);
  if (error) throw error;
  if (!data?.length) return quoted;
  const row = asRow(data[0]);
  const schema: Schema = {
    round: resolveKey(row, "Round"),
    results: resolveKey(row, "Results"),
    players: Object.fromEntries(
      PLAYER_IDS.map((id) => [id, resolveKey(row, id)])
    ) as Record<PlayerId, string>
  };
  cache().__fbwSchema = schema;
  return schema;
}

function rowsToStore(rows: Record<string, unknown>[], schema: Schema): StoreData {
  const store: StoreData = {
    picks: emptyPlayerPicks(),
    results: {},
    updatedAt: new Date().toISOString()
  };
  for (const row of rows) {
    const gameId = text(lookup(row, schema.round)) as GameId | null;
    if (!gameId) continue;
    for (const player of PLAYER_IDS) {
      const pick = text(lookup(row, schema.players[player]));
      if (pick) store.picks[player][gameId] = pick;
    }
    const official = text(lookup(row, schema.results));
    if (official) store.results[gameId] = official;
  }
  return store;
}

export async function readStore(): Promise<StoreData> {
  const schema = await detectSchema();
  const { data, error } = await supabaseServer().from("picks").select("*");
  if (error) throw error;
  if (!data?.length) return EMPTY;
  return rowsToStore(data.map(asRow), schema);
}

async function writeChangedCells(
  column: string,
  next: Partial<Record<GameId, string | null>>,
  previous: Partial<Record<GameId, string>>
): Promise<void> {
  const schema = await detectSchema();
  const client = supabaseServer();
  const updates = GAMES.flatMap((game) => {
    const value = next[game.id] ?? null;
    const before = previous[game.id] ?? null;
    if (value === before) return [];
    return [
      client
        .from("picks")
        .update({ [column]: value })
        .eq(schema.round, game.id)
    ];
  });
  if (!updates.length) return;
  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function savePicks(player: PlayerId, picks: Picks): Promise<StoreData> {
  const schema = await detectSchema();
  const current = await readStore();
  await writeChangedCells(schema.players[player], picks, current.picks[player]);
  return readStore();
}

export async function saveResults(results: Results): Promise<StoreData> {
  const schema = await detectSchema();
  const current = await readStore();
  await writeChangedCells(schema.results, results, current.results);
  return readStore();
}

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

function lowerPlayers(): Record<PlayerId, string> {
  return {
    R: "r",
    T: "t",
    S: "s",
    M: "m",
    B: "b",
    Tej: "tej",
    Mamama: "mamama"
  };
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
  const row = asRow(data?.[0]);
  const schema: Schema =
    data?.length && ("round" in row || "results" in row) && !("Round" in row)
      ? {
          round: "round",
          results: "results",
          players: lowerPlayers()
        }
      : quoted;
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
    const gameId = text(row[schema.round]) as GameId | null;
    if (!gameId) continue;
    for (const player of PLAYER_IDS) {
      const pick = text(row[schema.players[player]]);
      if (pick) store.picks[player][gameId] = pick;
    }
    const official = text(row[schema.results]);
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

async function writePlayerColumn(player: PlayerId, picks: Picks): Promise<void> {
  const schema = await detectSchema();
  const client = supabaseServer();
  const column = schema.players[player];
  const updates = GAMES.map((game) =>
    client
      .from("picks")
      .update({ [column]: picks[game.id] ?? null })
      .eq(schema.round, game.id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

async function writeResultsColumn(results: Results): Promise<void> {
  const schema = await detectSchema();
  const client = supabaseServer();
  const updates = GAMES.map((game) =>
    client
      .from("picks")
      .update({ [schema.results]: results[game.id] ?? null })
      .eq(schema.round, game.id)
  );
  const outcome = await Promise.all(updates);
  const failed = outcome.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

export async function savePicks(player: PlayerId, picks: Picks): Promise<StoreData> {
  await writePlayerColumn(player, picks);
  return readStore();
}

export async function saveResults(results: Results): Promise<StoreData> {
  await writeResultsColumn(results);
  return readStore();
}

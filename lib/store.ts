import { promises as fs } from "fs";
import path from "path";
import type { PlayerId, StoreData } from "./types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

const EMPTY: StoreData = {
  picks: { R: {}, T: {}, S: {}, M: {} },
  results: {},
  updatedAt: new Date(0).toISOString()
};

async function ensureStore(): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(EMPTY, null, 2));
  }
}

export async function readStore(): Promise<StoreData> {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw) as StoreData;
    return {
      picks: {
        R: parsed.picks?.R ?? {},
        T: parsed.picks?.T ?? {},
        S: parsed.picks?.S ?? {},
        M: parsed.picks?.M ?? {}
      },
      results: parsed.results ?? {},
      updatedAt: parsed.updatedAt ?? new Date().toISOString()
    };
  } catch {
    return EMPTY;
  }
}

export async function writeStore(data: StoreData): Promise<StoreData> {
  await ensureStore();
  const next: StoreData = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  await fs.writeFile(STORE_PATH, JSON.stringify(next, null, 2));
  return next;
}

export async function savePicks(player: PlayerId, picks: StoreData["picks"][PlayerId]) {
  const store = await readStore();
  store.picks[player] = picks;
  return writeStore(store);
}

export async function saveResults(results: StoreData["results"]) {
  const store = await readStore();
  store.results = results;
  return writeStore(store);
}

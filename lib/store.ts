import { promises as fs } from "fs";
import path from "path";
import type { PlayerId, StoreData } from "./types";

const STORE_KEY = "fbw-store";

const EMPTY: StoreData = {
  picks: { R: {}, T: {}, S: {}, M: {} },
  results: {},
  updatedAt: new Date(0).toISOString()
};

type GlobalStore = typeof globalThis & { __fbwStore?: StoreData };

function memory(): GlobalStore {
  return globalThis as GlobalStore;
}

function kvConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

function filePath(): string {
  if (process.env.VERCEL) return path.join("/tmp", "fbw-store.json");
  return path.join(process.cwd(), "data", "store.json");
}

function normalize(parsed: Partial<StoreData> | null | undefined): StoreData {
  return {
    picks: {
      R: parsed?.picks?.R ?? {},
      T: parsed?.picks?.T ?? {},
      S: parsed?.picks?.S ?? {},
      M: parsed?.picks?.M ?? {}
    },
    results: parsed?.results ?? {},
    updatedAt: parsed?.updatedAt ?? new Date().toISOString()
  };
}

async function redisCommand(command: unknown[]): Promise<unknown> {
  const kv = kvConfig();
  if (!kv) return null;
  const res = await fetch(kv.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kv.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command),
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Redis responded ${res.status}`);
  }
  const payload = (await res.json()) as { result?: unknown };
  return payload.result ?? null;
}

async function readFileStore(): Promise<StoreData | null> {
  try {
    const raw = await fs.readFile(filePath(), "utf8");
    return normalize(JSON.parse(raw) as StoreData);
  } catch {
    return null;
  }
}

async function writeFileStore(data: StoreData): Promise<void> {
  const target = filePath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(data, null, 2));
}

export async function readStore(): Promise<StoreData> {
  try {
    if (kvConfig()) {
      const raw = await redisCommand(["GET", STORE_KEY]);
      if (typeof raw === "string" && raw) {
        const store = normalize(JSON.parse(raw) as StoreData);
        memory().__fbwStore = store;
        return store;
      }
    }

    const fromFile = await readFileStore();
    if (fromFile) {
      memory().__fbwStore = fromFile;
      return fromFile;
    }
  } catch {
    // Fall through to memory / empty so Vercel never 500s on storage.
  }

  return memory().__fbwStore ?? EMPTY;
}

export async function writeStore(data: StoreData): Promise<StoreData> {
  const next: StoreData = {
    ...data,
    updatedAt: new Date().toISOString()
  };
  memory().__fbwStore = next;

  try {
    if (kvConfig()) {
      await redisCommand(["SET", STORE_KEY, JSON.stringify(next)]);
    } else {
      await writeFileStore(next);
    }
  } catch {
    // Keep the in-memory copy so a read-only host cannot break sign-in.
  }

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

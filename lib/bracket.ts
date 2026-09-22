import type { GameId, RoundId } from "./types";

export const ROUND_POINTS: Record<RoundId, number> = {
  r16: 1,
  qf: 2,
  sf: 4,
  f: 8
};

export const ROUND_LABELS: Record<RoundId, string> = {
  r16: "Round of 16",
  qf: "Quarterfinals",
  sf: "Semifinals",
  f: "Championship"
};

export type Game = {
  id: GameId;
  round: RoundId;
  label: string;
  date: string;
  region: "families" | "females" | "subadults" | "males" | "finals";
  feedA?: GameId;
  feedB?: GameId;
  seedA?: string;
  seedB?: string;
};

export const GAMES: Game[] = [
  {
    id: "r16-1",
    round: "r16",
    label: "Family 1",
    date: "Sep 22",
    region: "families",
    seedA: "132",
    seedB: "284"
  },
  {
    id: "r16-2",
    round: "r16",
    label: "Family 2",
    date: "Sep 22",
    region: "families",
    seedA: "806",
    seedB: "901"
  },
  {
    id: "r16-3",
    round: "r16",
    label: "Females 1",
    date: "Sep 22",
    region: "females",
    seedA: "909",
    seedB: "428"
  },
  {
    id: "r16-4",
    round: "r16",
    label: "Females 2",
    date: "Sep 22",
    region: "females",
    seedA: "131",
    seedB: "910"
  },
  {
    id: "r16-5",
    round: "r16",
    label: "Subadults",
    date: "Sep 23",
    region: "subadults",
    seedA: "694",
    seedB: "620"
  },
  {
    id: "r16-6",
    round: "r16",
    label: "Experience",
    date: "Sep 23",
    region: "subadults",
    seedA: "610",
    seedB: "89"
  },
  {
    id: "r16-7",
    round: "r16",
    label: "Heavyweights",
    date: "Sep 23",
    region: "males",
    seedA: "32",
    seedB: "164"
  },
  {
    id: "r16-8",
    round: "r16",
    label: "The Lip",
    date: "Sep 23",
    region: "males",
    seedA: "151",
    seedB: "903"
  },
  {
    id: "qf-1",
    round: "qf",
    label: "Family final",
    date: "Sep 24",
    region: "families",
    feedA: "r16-1",
    feedB: "r16-2"
  },
  {
    id: "qf-2",
    round: "qf",
    label: "Female final",
    date: "Sep 24",
    region: "females",
    feedA: "r16-3",
    feedB: "r16-4"
  },
  {
    id: "qf-3",
    round: "qf",
    label: "Young & old",
    date: "Sep 25",
    region: "subadults",
    feedA: "r16-5",
    feedB: "r16-6"
  },
  {
    id: "qf-4",
    round: "qf",
    label: "King of the river",
    date: "Sep 25",
    region: "males",
    feedA: "r16-7",
    feedB: "r16-8"
  },
  {
    id: "sf-1",
    round: "sf",
    label: "Semifinal · Left",
    date: "Sep 28",
    region: "finals",
    feedA: "qf-1",
    feedB: "qf-2"
  },
  {
    id: "sf-2",
    round: "sf",
    label: "Semifinal · Right",
    date: "Sep 28",
    region: "finals",
    feedA: "qf-3",
    feedB: "qf-4"
  },
  {
    id: "f-1",
    round: "f",
    label: "Fat Bear Week Final",
    date: "Sep 29",
    region: "finals",
    feedA: "sf-1",
    feedB: "sf-2"
  }
];

export const GAMES_BY_ID: Record<GameId, Game> = Object.fromEntries(
  GAMES.map((game) => [game.id, game])
) as Record<GameId, Game>;

export const CHILDREN: Record<GameId, GameId | undefined> = {
  "r16-1": "qf-1",
  "r16-2": "qf-1",
  "r16-3": "qf-2",
  "r16-4": "qf-2",
  "r16-5": "qf-3",
  "r16-6": "qf-3",
  "r16-7": "qf-4",
  "r16-8": "qf-4",
  "qf-1": "sf-1",
  "qf-2": "sf-1",
  "qf-3": "sf-2",
  "qf-4": "sf-2",
  "sf-1": "f-1",
  "sf-2": "f-1",
  "f-1": undefined
};

export function contestants(
  game: Game,
  picks: Partial<Record<GameId, string>>
): { a?: string; b?: string } {
  if (game.seedA && game.seedB) {
    return { a: game.seedA, b: game.seedB };
  }
  return {
    a: game.feedA && picks[game.feedA] != null ? String(picks[game.feedA]) : undefined,
    b: game.feedB && picks[game.feedB] != null ? String(picks[game.feedB]) : undefined
  };
}

export function clearDownstream(
  picks: Partial<Record<GameId, string>>,
  fromGame: GameId,
  oldWinner?: string
): Partial<Record<GameId, string>> {
  if (!oldWinner) return picks;
  const next = { ...picks };
  let current: GameId | undefined = fromGame;
  const displaced = oldWinner;
  while (current) {
    const child: GameId | undefined = CHILDREN[current];
    if (!child) break;
    if (next[child] === displaced) {
      delete next[child];
      current = child;
      continue;
    }
    break;
  }
  return next;
}

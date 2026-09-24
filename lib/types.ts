export const PLAYER_IDS = [
  "R",
  "T",
  "S",
  "M",
  "B",
  "Tej",
  "Mamama",
  "Kyla",
  "Carly"
] as const;
export type PlayerId = (typeof PLAYER_IDS)[number];
export type UserId = PlayerId | "admin";
export type RoundId = "r16" | "qf" | "sf" | "f";
export type GameId =
  | "r16-1"
  | "r16-2"
  | "r16-3"
  | "r16-4"
  | "r16-5"
  | "r16-6"
  | "r16-7"
  | "r16-8"
  | "qf-1"
  | "qf-2"
  | "qf-3"
  | "qf-4"
  | "sf-1"
  | "sf-2"
  | "f-1";

export type Picks = Partial<Record<GameId, string>>;
export type Results = Partial<Record<GameId, string>>;

export type Session = {
  userId: UserId;
  name: string;
  isAdmin: boolean;
};

export type StoreData = {
  picks: Record<PlayerId, Picks>;
  results: Results;
  updatedAt: string;
};

export function emptyPlayerPicks(): Record<PlayerId, Picks> {
  return {
    R: {},
    T: {},
    S: {},
    M: {},
    B: {},
    Tej: {},
    Mamama: {},
    Kyla: {},
    Carly: {}
  };
}

export type ScoreRow = {
  userId: PlayerId;
  name: string;
  points: number;
  byRound: Record<RoundId, number>;
  correct: number;
  possible: number;
};

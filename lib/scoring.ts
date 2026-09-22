import { GAMES, ROUND_POINTS } from "./bracket";
import { PLAYERS } from "./players";
import type { PlayerId, Picks, Results, RoundId, ScoreRow } from "./types";

export function scorePicks(picks: Picks, results: Results): Omit<ScoreRow, "userId" | "name"> {
  const byRound: Record<RoundId, number> = { r16: 0, qf: 0, sf: 0, f: 0 };
  let correct = 0;
  let possible = 0;

  for (const game of GAMES) {
    const official = results[game.id];
    if (!official) continue;
    possible += 1;
    if (String(picks[game.id]) === String(official)) {
      byRound[game.round] += ROUND_POINTS[game.round];
      correct += 1;
    }
  }

  return {
    points: byRound.r16 + byRound.qf + byRound.sf + byRound.f,
    byRound,
    correct,
    possible
  };
}

export function leaderboard(
  allPicks: Record<PlayerId, Picks>,
  results: Results
): ScoreRow[] {
  return PLAYERS.map((player) => ({
    userId: player.id,
    name: player.name,
    ...scorePicks(allPicks[player.id] ?? {}, results)
  })).sort((a, b) => b.points - a.points || a.userId.localeCompare(b.userId));
}

export function picksComplete(picks: Picks): boolean {
  return GAMES.every((game) => Boolean(picks[game.id]));
}

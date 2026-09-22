import { NextResponse } from "next/server";
import { isPlayerId, sessionFromRequest } from "@/lib/auth";
import { BEARS } from "@/lib/bears";
import { GAMES, contestants } from "@/lib/bracket";
import { isLocked, LOCK_AT, lockLabel } from "@/lib/lock";
import { leaderboard, picksComplete } from "@/lib/scoring";
import { readStore } from "@/lib/store";
import type { PlayerId, Picks } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = sessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 });
  }

  const store = await readStore();
  const locked = isLocked();
  const scores = leaderboard(store.picks, store.results);

  const visiblePicks: Record<string, Picks> = {};
  if (locked || session.isAdmin) {
    visiblePicks.R = store.picks.R;
    visiblePicks.T = store.picks.T;
    visiblePicks.S = store.picks.S;
    visiblePicks.M = store.picks.M;
  } else if (isPlayerId(session.userId)) {
    visiblePicks[session.userId] = store.picks[session.userId];
  }

  const submitted = (Object.keys(store.picks) as PlayerId[]).reduce(
    (acc, id) => {
      acc[id] = picksComplete(store.picks[id]);
      return acc;
    },
    {} as Record<PlayerId, boolean>
  );

  return NextResponse.json({
    session,
    locked,
    lockAt: LOCK_AT.toISOString(),
    lockLabel: lockLabel(),
    now: new Date().toISOString(),
    bears: BEARS,
    games: GAMES.map((game) => ({
      ...game,
      seeds: contestants(game, {})
    })),
    picks: visiblePicks,
    results: store.results,
    scores,
    submitted,
    updatedAt: store.updatedAt
  });
}

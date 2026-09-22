import { NextResponse } from "next/server";
import { isPlayerId, PLAYERS, sessionFromRequest } from "@/lib/auth";
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

  try {
    const store = await readStore();
    const locked = isLocked();
    const scores = leaderboard(store.picks, store.results);

    const visiblePicks: Record<string, Picks> = {};
    if (locked || session.isAdmin) {
      for (const player of PLAYERS) {
        visiblePicks[player.id] = store.picks[player.id];
      }
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load picks.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

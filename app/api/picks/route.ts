import { NextResponse } from "next/server";
import { isPlayerId, sessionFromRequest } from "@/lib/auth";
import { GAMES_BY_ID, CHILDREN, contestants, clearDownstream } from "@/lib/bracket";
import { isLocked } from "@/lib/lock";
import { savePicks, readStore } from "@/lib/store";
import { leaderboard, picksComplete } from "@/lib/scoring";
import type { GameId, Picks } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = sessionFromRequest(request);
  if (!session || !isPlayerId(session.userId)) {
    return NextResponse.json({ error: "Sign in as a player to pick." }, { status: 401 });
  }
  if (isLocked()) {
    return NextResponse.json(
      { error: "Brackets are locked for the night." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    gameId?: GameId;
    bearId?: string;
    picks?: Picks;
  } | null;

  const store = await readStore();
  let nextPicks: Picks = { ...(store.picks[session.userId] ?? {}) };

  if (body?.picks) {
    nextPicks = body.picks;
  } else if (body?.gameId && body?.bearId) {
    const game = GAMES_BY_ID[body.gameId];
    if (!game) {
      return NextResponse.json({ error: "Unknown matchup." }, { status: 400 });
    }
    const sides = contestants(game, nextPicks);
    if (body.bearId !== sides.a && body.bearId !== sides.b) {
      return NextResponse.json(
        { error: "That bear is not in this matchup yet." },
        { status: 400 }
      );
    }
    const oldWinner = nextPicks[body.gameId];
    nextPicks = {
      ...clearDownstream(nextPicks, body.gameId, oldWinner),
      [body.gameId]: body.bearId
    };
    const child = CHILDREN[body.gameId];
    if (child && nextPicks[child] && nextPicks[child] !== body.bearId) {
      // already handled by clearDownstream
    }
  } else {
    return NextResponse.json({ error: "Missing pick." }, { status: 400 });
  }

  try {
    const saved = await savePicks(session.userId, nextPicks);
    return NextResponse.json({
      picks: { [session.userId]: saved.picks[session.userId] },
      scores: leaderboard(saved.picks, saved.results),
      complete: picksComplete(saved.picks[session.userId]),
      updatedAt: saved.updatedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save pick.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

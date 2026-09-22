import { NextResponse } from "next/server";
import { sessionFromRequest } from "@/lib/auth";
import { GAMES_BY_ID, contestants, clearDownstream } from "@/lib/bracket";
import { leaderboard } from "@/lib/scoring";
import { readStore, saveResults } from "@/lib/store";
import type { GameId, Results } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = sessionFromRequest(request);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Admin only." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    gameId?: GameId;
    bearId?: string | null;
  } | null;

  if (!body?.gameId || !(body.gameId in GAMES_BY_ID)) {
    return NextResponse.json({ error: "Unknown matchup." }, { status: 400 });
  }

  const store = await readStore();
  let results: Results = { ...store.results };
  const game = GAMES_BY_ID[body.gameId];
  const sides = contestants(game, results);

  if (!body.bearId) {
    const oldWinner = results[body.gameId];
    delete results[body.gameId];
    results = clearDownstream(results, body.gameId, oldWinner) as Results;
  } else {
    if (body.bearId !== sides.a && body.bearId !== sides.b) {
      return NextResponse.json(
        { error: "Set earlier-round winners first." },
        { status: 400 }
      );
    }
    const oldWinner = results[body.gameId];
    results = {
      ...(clearDownstream(results, body.gameId, oldWinner) as Results),
      [body.gameId]: body.bearId
    };
  }

  try {
    const saved = await saveResults(results);
    return NextResponse.json({
      results: saved.results,
      scores: leaderboard(saved.picks, saved.results),
      updatedAt: saved.updatedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save result.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

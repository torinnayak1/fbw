"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getBear, type Bear } from "@/lib/bears";
import {
  GAMES,
  ROUND_LABELS,
  ROUND_POINTS,
  clearDownstream,
  contestants,
  type Game
} from "@/lib/bracket";
import { PLAYERS } from "@/lib/players";
import { leaderboard, picksComplete } from "@/lib/scoring";
import type { GameId, Picks, PlayerId, Results, ScoreRow, Session } from "@/lib/types";
import { usePicksLive } from "@/lib/use-picks-live";

type AppState = {
  session: Session;
  locked: boolean;
  lockAt: string;
  lockLabel: string;
  now: string;
  picks: Record<string, Picks>;
  results: Results;
  scores: ScoreRow[];
  submitted: Record<PlayerId, boolean>;
};

const PLAYER_IDS: PlayerId[] = PLAYERS.map((player) => player.id);

function submittedFrom(picks: Record<string, Picks>): Record<PlayerId, boolean> {
  return PLAYER_IDS.reduce(
    (acc, id) => {
      acc[id] = picksComplete(picks[id] ?? {});
      return acc;
    },
    {} as Record<PlayerId, boolean>
  );
}

function withDerived(state: AppState): AppState {
  const picks = state.picks as Record<PlayerId, Picks>;
  return {
    ...state,
    scores: leaderboard(picks, state.results),
    submitted: submittedFrom(state.picks)
  };
}

export function ChampionshipApp() {
  const [state, setState] = useState<AppState | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState("");
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    const res = await fetch("/api/state", { cache: "no-store" });
    const payload = await res.json().catch(() => null);
    if (seq !== loadSeq.current) return;
    if (res.status === 401) {
      setState(null);
      setAuthChecked(true);
      return;
    }
    if (!res.ok) {
      setError(payload?.error ?? "Could not load the championship.");
      setAuthChecked(true);
      return;
    }
    setState(withDerived(payload as AppState));
    setAuthChecked(true);
    setError("");
  }, []);

  const applyState = useCallback((updater: (prev: AppState) => AppState) => {
    loadSeq.current += 1;
    setState((prev) => (prev ? withDerived(updater(prev)) : prev));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  usePicksLive(Boolean(state?.session), load);

  if (!authChecked) {
    return (
      <Shell>
        <p className="py-24 text-center text-lg tracking-wide text-cream/70">
          Scouting Brooks River…
        </p>
      </Shell>
    );
  }

  if (!state) {
    return (
      <Shell>
        <LoginScreen
          error={error}
          onLogin={async (userId, password) => {
            setError("");
            const res = await fetch("/api/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, password })
            });
            const data = await res.json();
            if (!res.ok) {
              setError(data.error ?? "Login failed.");
              return;
            }
            await load();
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      {state.session.isAdmin ? (
        <AdminView state={state} onRefresh={load} onApply={applyState} />
      ) : (
        <PlayerView state={state} onRefresh={load} onApply={applyState} />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <header className="mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-gold">
          Katmai National Park · 9-Player Pool
        </p>
        <h1 className="title-stroke font-display text-4xl leading-none text-salmon sm:text-6xl">
          FAT BEAR WEEK
        </h1>
        <p className="mt-1 font-display text-2xl text-gold sm:text-3xl">2026 Championship</p>
      </header>
      {children}
    </main>
  );
}

function LoginScreen({
  error,
  onLogin
}: {
  error: string;
  onLogin: (userId: string, password: string) => Promise<void>;
}) {
  const [userId, setUserId] = useState<string>("R");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <section className="mx-auto max-w-md rounded-3xl bg-moss/80 p-6 pixel-border">
      <p className="mb-4 text-center text-sm text-cream/80">
        Sign in as yourself. Brackets are locked — you can view every sheet.
        Correct winners score 1 / 2 / 4 / 8 points as rounds go deeper.
      </p>
      <div className="mb-5 grid grid-cols-3 gap-2">
        {PLAYER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setUserId(id)}
            className={`rounded-2xl px-2 py-4 font-display text-lg leading-tight transition sm:text-xl ${
              userId === id
                ? "bg-salmon text-cream"
                : "bg-spruce text-cream/70 hover:bg-canopy"
            }`}
          >
            {id}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setUserId("admin")}
        className={`mb-4 w-full rounded-xl py-2 text-sm font-bold ${
          userId === "admin" ? "bg-gold text-bark" : "bg-spruce text-cream/60 hover:text-cream"
        }`}
      >
        Ranger / Admin
      </button>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          await onLogin(userId, password);
          setBusy(false);
        }}
        className="space-y-3"
      >
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border-2 border-gold/30 bg-spruce px-4 py-3 text-cream outline-none focus:border-gold"
        />
        {error ? <p className="text-sm text-salmon">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full rounded-xl bg-gold py-3 font-display text-lg text-bark disabled:opacity-50"
        >
          {busy ? "Checking…" : "Enter the river"}
        </button>
      </form>
    </section>
  );
}

function PlayerView({
  state,
  onRefresh,
  onApply
}: {
  state: AppState;
  onRefresh: () => Promise<void>;
  onApply: (updater: (prev: AppState) => AppState) => void;
}) {
  const playerId = state.session.userId as PlayerId;
  const [viewing, setViewing] = useState<PlayerId>(playerId);
  const [inspect, setInspect] = useState<Bear | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const canEdit = !state.locked && viewing === playerId;
  const myPicks = state.picks[viewing] ?? {};

  async function pick(gameId: GameId, bearId: string) {
    if (!canEdit) return;
    const current = state.picks[playerId] ?? {};
    const nextPicks: Picks = {
      ...clearDownstream(current, gameId, current[gameId]),
      [gameId]: bearId
    };
    onApply((prev) => ({
      ...prev,
      picks: { ...prev.picks, [playerId]: nextPicks }
    }));
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, bearId })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not save pick.");
        await onRefresh();
        return;
      }
      onApply((prev) => ({
        ...prev,
        picks: {
          ...prev.picks,
          [playerId]: {
            ...nextPicks,
            ...(data.picks?.[playerId] ?? {})
          }
        }
      }));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <TopBar state={state} playerId={playerId} onLogout={logout} />
      <Standings scores={state.scores} submitted={state.submitted} locked={state.locked} />
      {state.locked ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PLAYER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewing(id)}
              className={`rounded-full px-4 py-2 font-display ${
                viewing === id ? "bg-gold text-bark" : "bg-moss text-cream/80"
              }`}
            >
              {id}&apos;s bracket
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-cream/70">
          Pick a winner in every matchup. You can change picks until lock.
          Other brackets stay hidden until then.
        </p>
      )}
      {message ? <p className="text-center text-salmon">{message}</p> : null}
      <BracketBoard
        picks={myPicks}
        results={state.results}
        canEdit={canEdit && !busy}
        onPick={pick}
        onInspect={setInspect}
      />
      {inspect ? <PhotoModal bear={inspect} onClose={() => setInspect(null)} /> : null}
    </div>
  );
}

function AdminView({
  state,
  onRefresh,
  onApply
}: {
  state: AppState;
  onRefresh: () => Promise<void>;
  onApply: (updater: (prev: AppState) => AppState) => void;
}) {
  const [inspect, setInspect] = useState<Bear | null>(null);
  const [viewing, setViewing] = useState<PlayerId>("R");

  async function setResult(gameId: GameId, bearId: string | null) {
    const current = state.results[gameId];
    const base = { ...state.results };
    if (!bearId) delete base[gameId];
    const cleared = clearDownstream(base, gameId, current) as Results;
    const nextResults: Results = bearId ? { ...cleared, [gameId]: bearId } : cleared;
    onApply((prev) => ({ ...prev, results: nextResults }));
    const res = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, bearId })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      await onRefresh();
      return;
    }
    onApply((prev) => ({
      ...prev,
      results:
        data?.results && Object.keys(data.results).length > 0
          ? data.results
          : nextResults
    }));
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <TopBar state={state} playerId="admin" onLogout={logout} />
      <Standings scores={state.scores} submitted={state.submitted} locked={state.locked} />
      <p className="text-center text-sm text-gold">
        Tap the official Fat Bear Week winner for each matchup as results come in.
      </p>
      <BracketBoard
        picks={state.results}
        results={state.results}
        canEdit
        admin
        onPick={(gameId, bearId) => {
          const current = state.results[gameId];
          void setResult(gameId, current === bearId ? null : bearId);
        }}
        onInspect={setInspect}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PLAYER_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setViewing(id)}
            className={`rounded-full px-4 py-2 font-display ${
              viewing === id ? "bg-gold text-bark" : "bg-moss text-cream/80"
            }`}
          >
            {id}
          </button>
        ))}
      </div>
      <BracketBoard
        picks={state.picks[viewing] ?? {}}
        results={state.results}
        canEdit={false}
        onPick={() => undefined}
        onInspect={setInspect}
      />
      {inspect ? <PhotoModal bear={inspect} onClose={() => setInspect(null)} /> : null}
    </div>
  );
}

function TopBar({
  state,
  playerId,
  onLogout
}: {
  state: AppState;
  playerId: string;
  onLogout: () => void;
}) {
  const mine = state.scores.find((row) => row.userId === playerId);
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-3xl bg-moss/70 px-5 py-4 sm:flex-row">
      <div>
        <p className="font-display text-xl text-gold">Player {playerId}</p>
        {mine ? (
          <p className="text-sm text-cream/70">
            {mine.points} {mine.points === 1 ? "pt" : "pts"} · {mine.correct}/
            {mine.possible || 15} correct
          </p>
        ) : (
          <p className="text-sm text-cream/70">Official results desk</p>
        )}
      </div>
      <Countdown lockAt={state.lockAt} locked={state.locked} label={state.lockLabel} />
      <button
        type="button"
        onClick={onLogout}
        className="rounded-full border border-cream/20 px-4 py-2 text-sm text-cream/70 hover:text-cream"
      >
        Log out
      </button>
    </div>
  );
}

function Countdown({
  lockAt,
  locked,
  label
}: {
  lockAt: string;
  locked: boolean;
  label: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (locked) {
    return (
      <p className="rounded-full bg-salmon px-4 py-2 text-center font-display text-sm text-cream">
        Brackets locked
      </p>
    );
  }
  const remaining = Math.max(0, new Date(lockAt).getTime() - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return (
    <div className="text-center">
      <p className="font-display text-lg text-gold">
        Locks in {hours}h {minutes}m {seconds}s
      </p>
      <p className="text-xs text-cream/60">{label}</p>
    </div>
  );
}

function Standings({
  scores,
  submitted,
  locked
}: {
  scores: ScoreRow[];
  submitted: Record<PlayerId, boolean>;
  locked: boolean;
}) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {scores.map((row, index) => (
        <article
          key={row.userId}
          className={`rounded-2xl bg-spruce/80 p-4 ${index === 0 && row.points > 0 ? "pixel-border" : ""}`}
        >
          <p className="text-xs uppercase tracking-widest text-cream/50">
            {index === 0 && row.points > 0 ? "Leading" : `Place ${index + 1}`}
          </p>
          <p className="font-display text-2xl leading-tight text-gold sm:text-3xl">{row.userId}</p>
          <p className="text-2xl font-bold text-cream">{row.points}</p>
          <p className="text-xs text-cream/50">
            {ROUND_POINTS.r16}/{ROUND_POINTS.qf}/{ROUND_POINTS.sf}/{ROUND_POINTS.f} pts by round
          </p>
          <p className="mt-1 text-xs text-river">
            {locked || submitted[row.userId] ? "Bracket in" : "Still picking"}
          </p>
        </article>
      ))}
    </section>
  );
}

function BracketBoard({
  picks,
  results,
  canEdit,
  admin,
  onPick,
  onInspect
}: {
  picks: Picks;
  results: Results;
  canEdit: boolean;
  admin?: boolean;
  onPick: (gameId: GameId, bearId: string) => void;
  onInspect: (bear: Bear) => void;
}) {
  const rounds = useMemo(
    () =>
      (["r16", "qf", "sf", "f"] as const).map((round) => ({
        round,
        games: GAMES.filter((game) => game.round === round)
      })),
    []
  );
  const championId = picks["f-1"];
  const champion = getBear(championId);

  return (
    <div className="space-y-10">
      {rounds.map(({ round, games }) => (
        <section key={round}>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl text-gold">{ROUND_LABELS[round]}</h2>
            <p className="text-sm text-cream/60">{ROUND_POINTS[round]} pts each</p>
          </div>
          <div
            className={`grid gap-4 ${
              games.length > 2 ? "sm:grid-cols-2" : "sm:grid-cols-2"
            }`}
          >
            {games.map((game) => (
              <MatchupCard
                key={game.id}
                game={game}
                picks={picks}
                results={results}
                canEdit={canEdit}
                admin={admin}
                onPick={onPick}
                onInspect={onInspect}
              />
            ))}
          </div>
        </section>
      ))}
      {champion ? (
        <section className="rounded-3xl bg-salmon/15 p-6 text-center salmon-border">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Predicted champion</p>
          <h3 className="mt-2 font-display text-3xl text-cream">{champion.name}</h3>
          <button type="button" onClick={() => onInspect(champion)} className="mx-auto mt-4 block">
            <BearPortrait bear={champion} className="mx-auto h-52 w-52 rounded-3xl" />
          </button>
        </section>
      ) : null}
    </div>
  );
}

function MatchupCard({
  game,
  picks,
  results,
  canEdit,
  admin,
  onPick,
  onInspect
}: {
  game: Game;
  picks: Picks;
  results: Results;
  canEdit: boolean;
  admin?: boolean;
  onPick: (gameId: GameId, bearId: string) => void;
  onInspect: (bear: Bear) => void;
}) {
  const sides = contestants(game, picks);
  const pick = picks[game.id] != null ? String(picks[game.id]) : undefined;
  const official = results[game.id] != null ? String(results[game.id]) : undefined;
  return (
    <article className="overflow-hidden rounded-3xl bg-moss/80">
      <div className="flex items-center justify-between px-4 py-2 text-xs uppercase tracking-widest text-cream/50">
        <span>
          {game.label} · {game.date}
        </span>
        <span>{ROUND_POINTS[game.round]} pts</span>
      </div>
      <div className="grid grid-cols-2">
        <BearButton
          bearId={sides.a}
          selected={pick === sides.a}
          official={official}
          disabled={!canEdit || !sides.a}
          admin={admin}
          onPick={() => sides.a && onPick(game.id, sides.a)}
          onInspect={onInspect}
        />
        <BearButton
          bearId={sides.b}
          selected={pick === sides.b}
          official={official}
          disabled={!canEdit || !sides.b}
          admin={admin}
          onPick={() => sides.b && onPick(game.id, sides.b)}
          onInspect={onInspect}
        />
      </div>
    </article>
  );
}

function BearButton({
  bearId,
  selected,
  official,
  disabled,
  admin,
  onPick,
  onInspect
}: {
  bearId?: string;
  selected: boolean;
  official?: string;
  disabled: boolean;
  admin?: boolean;
  onPick: () => void;
  onInspect: (bear: Bear) => void;
}) {
  const bear = getBear(bearId);
  if (!bear) {
    return (
      <div className="flex min-h-48 items-center justify-center bg-spruce/50 p-4 text-sm text-cream/40">
        Winner TBD
      </div>
    );
  }
  const lost = Boolean(official && official !== bear.id);
  const wonOfficial = official === bear.id;
  return (
    <div className={`relative ${lost ? "opacity-45 grayscale" : ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={onPick}
        className={`block w-full text-left ${selected ? "ring-4 ring-inset ring-gold" : ""}`}
      >
        <BearPortrait bear={bear} className="h-44 w-full sm:h-52" />
        <div className="bg-spruce px-3 py-3">
          <p className="font-display text-lg leading-tight text-cream">{bear.name}</p>
          <p className="text-xs text-cream/50">{bear.nickname}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onInspect(bear)}
        className="absolute right-2 top-2 rounded-full bg-bark/80 px-2 py-1 text-xs text-cream"
      >
        Before / after
      </button>
      {selected ? (
        <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-1 text-xs font-bold text-bark">
          {admin ? "Official" : "Pick"}
        </span>
      ) : null}
      {wonOfficial ? (
        <span className="absolute bottom-16 left-2 rounded-full bg-river px-2 py-1 text-xs font-bold">
          Won
        </span>
      ) : null}
    </div>
  );
}

function BearPortrait({ bear, className }: { bear: Bear; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-black ${className ?? ""}`}>
      <img
        src={bear.photo}
        alt={bear.name}
        loading="lazy"
        className="absolute top-1/2 right-0 h-[122%] w-auto max-w-none -translate-y-1/2"
      />
    </div>
  );
}

function PhotoModal({ bear, onClose }: { bear: Bear; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl bg-bark p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl text-gold">{bear.name}</h3>
            <p className="max-w-3xl text-sm text-cream/80">{bear.blurb}</p>
          </div>
          <button type="button" onClick={onClose} className="text-cream/70">
            Close
          </button>
        </div>
        <img
          src={bear.photo}
          alt={`${bear.name} before and after`}
          className="w-full rounded-2xl"
        />
        <p className="mt-2 text-xs text-cream/40">
          Official Fat Bear Week 2026 photos via NPS / Explore.org
        </p>
      </div>
    </div>
  );
}

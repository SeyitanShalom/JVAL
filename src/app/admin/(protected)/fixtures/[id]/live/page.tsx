import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FiArrowLeft,
  FiPlay,
  FiPause,
  FiCheckCircle,
  FiAlertCircle,
  FiTrash2,
  FiActivity,
  FiShield,
  FiUser,
  FiZap,
} from "react-icons/fi";
import { getAdminLiveMatchData } from "@/lib/admin-fixtures";
import {
  updateMatchLiveStatusAction,
  logGoalEventAction,
  logCardEventAction,
  logSubstitutionEventAction,
  logPenaltyAttemptAction,
  deleteMatchEventAction,
  deletePenaltyAttemptAction,
} from "../../live-actions";
import { simulateMatchAction } from "../../simulation-actions";
import LiveEventLogger from "./LiveEventLogger";
import LiveMatchClock from "@/app/components/LiveMatchClock";

export default async function AdminLiveMatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ event_added?: string; penalty_added?: string; error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getAdminLiveMatchData(id);

  if (!data) {
    notFound();
  }

  const { match, homeTeam, awayTeam, venue, competition, events, penalties, databaseReady } = data;

  const STATUS_CONFIG: Record<
    string,
    { label: string; tone: "slate" | "blue" | "amber" | "green" | "purple" }
  > = {
    UPCOMING: { label: "Upcoming", tone: "slate" },
    LIVE: { label: "Live in Progress", tone: "blue" },
    HALFTIME: { label: "Half-time", tone: "amber" },
    PENALTIES: { label: "Penalties", tone: "purple" },
    FULLTIME: { label: "Full-time", tone: "green" },
    POSTPONED: { label: "Postponed", tone: "amber" },
  };

  const currentStatus = STATUS_CONFIG[match.status] || STATUS_CONFIG.UPCOMING;

  return (
    <div className="space-y-6">
      {/* Back link & Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin/fixtures"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-600"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Fixtures
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <FiActivity className="h-3.5 w-3.5 animate-pulse" />
            Live Match Console
          </span>
          {!databaseReady && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              Sample Mode (Connect DB in .env)
            </span>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {query.event_added && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          ✓ Match event logged and score updated.
        </div>
      )}
      {query.penalty_added && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          ✓ Penalty attempt recorded and shootout score updated.
        </div>
      )}
      {query.error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
          ⚠️ Action could not be completed. Check database connection.
        </div>
      )}

      {/* Main Scoreboard Deck */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 text-xs font-bold text-blue-200 uppercase tracking-wider">
          <span>{competition.name} · {match.matchday}</span>
          <span>📍 {venue.name} ({venue.location})</span>
        </div>

        <div className="my-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
          {/* Home Team */}
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white shadow-inner sm:h-20 sm:w-20 sm:text-2xl">
              {homeTeam.shortName}
            </div>
            <h2 className="mt-3 text-base font-bold sm:text-xl">{homeTeam.name}</h2>
            <span className="mt-0.5 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-200">
              Home
            </span>
          </div>

          {/* Center Score */}
          <div className="flex flex-col items-center px-4">
            <div className="flex items-center gap-3 text-4xl font-bold sm:text-6xl tabular-nums tracking-wider text-white">
              <span>{match.homeScore}</span>
              <span className="text-slate-500">:</span>
              <span>{match.awayScore}</span>
            </div>

            {match.homePenaltyScore !== null && match.awayPenaltyScore !== null && (
              <span className="mt-2 rounded-full bg-purple-500/30 px-3 py-1 text-xs font-bold text-purple-200">
                Penalties: {match.homePenaltyScore} – {match.awayPenaltyScore}
              </span>
            )}

            <div className="mt-3">
              <LiveMatchClock
                status={match.status}
                minute={match.minuteLabel}
                variant="hero"
              />
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-white shadow-inner sm:h-20 sm:w-20 sm:text-2xl">
              {awayTeam.shortName}
            </div>
            <h2 className="mt-3 text-base font-bold sm:text-xl">{awayTeam.name}</h2>
            <span className="mt-0.5 rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-200">
              Away
            </span>
          </div>
        </div>

        {/* Live Period Switcher Bar */}
        <div className="border-t border-white/10 pt-4">
          <p className="mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            Quick Status Switcher
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { status: "UPCOMING", label: "Upcoming", minute: "" },
              { status: "LIVE", label: "▶ 1st Half", minute: "1'" },
              { status: "HALFTIME", label: "⏸ Half-time", minute: "HT" },
              { status: "LIVE", label: "▶ 2nd Half", minute: "46'" },
              { status: "PENALTIES", label: "🥅 Penalties", minute: "PEN" },
              { status: "FULLTIME", label: "✓ Full-time", minute: "FT" },
            ].map((btn, i) => (
              <form
                key={i}
                action={updateMatchLiveStatusAction.bind(null, match.id, btn.status, btn.minute)}
              >
                <button
                  type="submit"
                  disabled={!databaseReady}
                  className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  {btn.label}
                </button>
              </form>
            ))}

            <form action={simulateMatchAction.bind(null, match.id)}>
              <button
                type="submit"
                disabled={!databaseReady}
                title="Automatically generate realistic goals, cards, and finish match"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/50 bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
              >
                <FiZap className="h-3.5 w-3.5" />
                ⚡ Auto-Simulate Full Match
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Grid: Left = Event Logger, Right = Timeline & Shootouts */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Event Logger Deck (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <LiveEventLogger
            matchId={match.id}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            databaseReady={databaseReady}
            onLogGoal={logGoalEventAction}
            onLogCard={logCardEventAction}
            onLogSubstitution={logSubstitutionEventAction}
            onLogPenalty={logPenaltyAttemptAction}
          />
        </div>

        {/* Right Column: Live Timeline & Penalties (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Match Timeline Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <FiActivity className="text-blue-600" />
                Live Timeline Events
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                {events.length} logged
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {events.map((ev) => {
                const isHome = ev.competitionTeamId === homeTeam.competitionTeamId;
                const teamShort = isHome ? homeTeam.shortName : awayTeam.shortName;

                return (
                  <div
                    key={ev.id}
                    className="group flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-800">
                        {ev.minute}&apos;
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-950">
                          {ev.type === "GOAL" && "⚽ GOAL — "}
                          {ev.type === "PENALTY_SCORED" && "⚽ PENALTY GOAL — "}
                          {ev.type === "OWN_GOAL" && "⚽ OWN GOAL — "}
                          {ev.type === "YELLOW_CARD" && "🟨 YELLOW CARD — "}
                          {ev.type === "RED_CARD" && "🟥 RED CARD — "}
                          {ev.type === "SUBSTITUTION" && "🔄 SUB — "}
                          <span className="text-blue-700">{teamShort}</span>
                        </p>
                        <p className="text-xs font-semibold text-slate-700">
                          {ev.playerName || "Player"}
                          {ev.assistPlayerName && (
                            <span className="text-slate-500 font-normal"> (Assist: {ev.assistPlayerName})</span>
                          )}
                          {ev.playerInName && ev.playerOutName && (
                            <span className="text-slate-600">
                              (In: {ev.playerInName}, Out: {ev.playerOutName})
                            </span>
                          )}
                        </p>
                        {ev.note && <p className="text-[11px] text-slate-400 mt-0.5">{ev.note}</p>}
                      </div>
                    </div>

                    <form action={deleteMatchEventAction.bind(null, ev.id, match.id)}>
                      <button
                        type="submit"
                        disabled={!databaseReady}
                        title="Delete this event (rolls back score if goal)"
                        className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-0"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                );
              })}

              {events.length === 0 && (
                <p className="py-6 text-center text-xs font-bold text-slate-400">
                  No events logged yet. Use the control deck to add goals, cards, and substitutions.
                </p>
              )}
            </div>
          </div>

          {/* Penalty Shootout Feed */}
          {penalties.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                  🥅 Penalty Shootout Feed
                </h3>
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700">
                  {penalties.length} kicks taken
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {penalties.map((pen) => {
                  const isHome = pen.competitionTeamId === homeTeam.competitionTeamId;
                  const teamShort = isHome ? homeTeam.shortName : awayTeam.shortName;

                  return (
                    <div
                      key={pen.id}
                      className="group flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                            pen.scored ? "bg-emerald-600" : "bg-red-600"
                          }`}
                        >
                          {pen.scored ? "✓" : "✗"}
                        </span>
                        <span className="font-bold text-slate-950">
                          Round {pen.round} · {teamShort}: {pen.takerName}
                        </span>
                      </div>

                      <form action={deletePenaltyAttemptAction.bind(null, pen.id, match.id)}>
                        <button
                          type="submit"
                          disabled={!databaseReady}
                          className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-400 transition hover:text-red-600"
                        >
                          <FiTrash2 className="h-3 w-3" />
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Team Squad Reference Accordions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-950 mb-3 flex items-center gap-2">
              <FiShield className="text-blue-600" />
              Squad Rosters Reference
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-blue-700 mb-1.5 uppercase tracking-wider">
                  {homeTeam.name} ({homeTeam.squad.length} registered)
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 text-xs rounded-lg border border-slate-100 p-2">
                  {homeTeam.squad.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-slate-700">
                      <span>#{p.number} {p.name}</span>
                      <span className="text-[10px] font-bold text-slate-400">{p.position}</span>
                    </div>
                  ))}
                  {homeTeam.squad.length === 0 && (
                    <p className="text-slate-400">No players registered in team season.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-indigo-700 mb-1.5 uppercase tracking-wider">
                  {awayTeam.name} ({awayTeam.squad.length} registered)
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 text-xs rounded-lg border border-slate-100 p-2">
                  {awayTeam.squad.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-slate-700">
                      <span>#{p.number} {p.name}</span>
                      <span className="text-[10px] font-bold text-slate-400">{p.position}</span>
                    </div>
                  ))}
                  {awayTeam.squad.length === 0 && (
                    <p className="text-slate-400">No players registered in team season.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

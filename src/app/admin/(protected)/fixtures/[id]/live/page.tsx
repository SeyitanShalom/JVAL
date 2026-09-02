import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FiArrowLeft,
  FiTrash2,
  FiActivity,
  FiSave,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import {
  getAdminLiveMatchData,
  type LiveMatchLineup,
  type LiveSquadPlayer,
} from "@/lib/admin-fixtures";
import {
  updateMatchLiveStatusAction,
  saveMatchLineupAction,
  logGoalEventAction,
  logDisallowedGoalAction,
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
  searchParams: Promise<{
    event_added?: string;
    penalty_added?: string;
    lineup_saved?: string;
    error?: string;
  }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getAdminLiveMatchData(id);

  if (!data) {
    notFound();
  }

  const { match, homeTeam, awayTeam, venue, competition, events, penalties, databaseReady } = data;

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
          Match event logged and score updated.
        </div>
      )}
      {query.penalty_added && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          Penalty attempt recorded and shootout score updated.
        </div>
      )}
      {query.lineup_saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          Team lineup saved.
        </div>
      )}
      {query.error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
          {query.error === "future_time"
            ? "That event minute is ahead of the current match clock."
            : query.error === "lineup_team"
            ? "That lineup does not belong to either team in this match."
            : "Action could not be completed. Check input and database connection."}
        </div>
      )}

      {/* Main Scoreboard Deck */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4 text-xs font-bold text-blue-200 uppercase tracking-[0.08em]">
          <span>{competition.name} - {match.matchday}</span>
          <span>{venue.name} ({venue.location})</span>
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
            <div className="flex items-center gap-3 text-4xl font-bold sm:text-6xl tabular-nums tracking-[0.08em] text-white">
              <span>{match.homeScore}</span>
              <span className="text-slate-500">:</span>
              <span>{match.awayScore}</span>
            </div>

            {match.homePenaltyScore !== null && match.awayPenaltyScore !== null && (
              <span className="mt-2 rounded-full bg-purple-500/30 px-3 py-1 text-xs font-bold text-purple-200">
                Penalties: {match.homePenaltyScore} - {match.awayPenaltyScore}
              </span>
            )}

            <div className="mt-3">
              <LiveMatchClock
                status={match.status}
                minute={match.minuteLabel}
                currentPeriod={match.currentPeriod}
                firstHalfStartedAt={match.firstHalfStartedAt}
                secondHalfStartedAt={match.secondHalfStartedAt}
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
          <p className="mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-[0.08em]">
            Quick Status Switcher
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { status: "UPCOMING", label: "Upcoming", minute: "" },
              { status: "LIVE", label: "1st Half", minute: "1'" },
              { status: "HALFTIME", label: "Half-time", minute: "HT" },
              { status: "LIVE", label: "2nd Half", minute: "46'" },
              { status: "PENALTIES", label: "Penalties", minute: "PEN" },
              { status: "FULLTIME", label: "Full-time", minute: "FT" },
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
                Auto-Simulate Full Match
              </button>
            </form>
          </div>
        </div>
      </section>

      <LineupEditor
        matchId={match.id}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        databaseReady={databaseReady}
      />

      {/* Main Grid: Left = Event Logger, Right = Timeline & Shootouts */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Event Logger Deck (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <LiveEventLogger
            matchId={match.id}
            matchStatus={match.status}
            matchMinute={match.minuteLabel}
            currentPeriod={match.currentPeriod}
            firstHalfStartedAt={match.firstHalfStartedAt}
            secondHalfStartedAt={match.secondHalfStartedAt}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            databaseReady={databaseReady}
            onLogGoal={logGoalEventAction}
            onLogDisallowedGoal={logDisallowedGoalAction}
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
                const isOwnGoal = ev.type === "OWN_GOAL";
                const teamShort = isOwnGoal
                  ? isHome
                    ? awayTeam.shortName
                    : homeTeam.shortName
                  : isHome
                  ? homeTeam.shortName
                  : awayTeam.shortName;
                const isDisallowed = ev.note?.includes("Disallowed Goal");
                const eventTimeLabel = ev.minuteLabel || (ev.minute !== null ? `${ev.minute}'` : "-");

                return (
                  <div
                    key={ev.id}
                    className={`group flex items-start justify-between gap-3 rounded-xl border p-3 transition ${
                      isDisallowed
                        ? "border-red-200 bg-red-50/50 hover:bg-red-50"
                        : "border-slate-100 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-7 min-w-12 shrink-0 items-center justify-center rounded-lg px-2 text-xs font-bold tabular-nums ${
                          isDisallowed ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {eventTimeLabel}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-950">
                          {isDisallowed && "DISALLOWED GOAL - "}
                          {!isDisallowed && ev.type === "GOAL" && "GOAL - "}
                          {!isDisallowed && ev.type === "PENALTY_SCORED" && "PENALTY GOAL - "}
                          {!isDisallowed && ev.type === "OWN_GOAL" && "OWN GOAL - "}
                          {!isDisallowed && ev.type === "YELLOW_CARD" && "YELLOW CARD - "}
                          {!isDisallowed && ev.type === "RED_CARD" && "RED CARD - "}
                          {!isDisallowed && ev.type === "SUBSTITUTION" && "SUB - "}
                          <span className={isDisallowed ? "text-red-700" : "text-blue-700"}>
                            {teamShort}
                          </span>
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
                        {ev.note && <p className="text-[11px] text-slate-500 mt-0.5">{ev.note}</p>}
                      </div>
                    </div>

                    <form action={deleteMatchEventAction.bind(null, ev.id, match.id)}>
                      <button
                        type="submit"
                        disabled={!databaseReady}
                        title="Delete/undo this event (rolls back score if goal, recalculates standings)"
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
                  Penalty Shootout Feed
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
                      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 text-xs font-bold"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-purple-100 text-[11px] text-purple-800">
                          #{pen.sequence}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] ${
                            pen.scored ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pen.scored ? "SCORED" : "MISSED"}
                        </span>
                        <span className="text-slate-900">
                          {teamShort} - {pen.takerName}
                        </span>
                      </div>

                      <form action={deletePenaltyAttemptAction.bind(null, pen.id, match.id)}>
                        <button
                          type="submit"
                          disabled={!databaseReady}
                          title="Delete this penalty kick record"
                          className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-0"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type LineupTeamInfo = {
  competitionTeamId: string;
  name: string;
  shortName: string;
  squad: LiveSquadPlayer[];
  lineup: LiveMatchLineup | null;
};

function LineupEditor({
  matchId,
  homeTeam,
  awayTeam,
  databaseReady,
}: {
  matchId: string;
  homeTeam: LineupTeamInfo;
  awayTeam: LineupTeamInfo;
  databaseReady: boolean;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
          <FiUsers className="text-blue-600" />
          Team Lineups
        </h3>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <LineupTeamForm
          matchId={matchId}
          team={homeTeam}
          sideLabel="Home"
          databaseReady={databaseReady}
        />
        <LineupTeamForm
          matchId={matchId}
          team={awayTeam}
          sideLabel="Away"
          databaseReady={databaseReady}
        />
      </div>
    </section>
  );
}

function LineupTeamForm({
  matchId,
  team,
  sideLabel,
  databaseReady,
}: {
  matchId: string;
  team: LineupTeamInfo;
  sideLabel: "Home" | "Away";
  databaseReady: boolean;
}) {
  const roleByPlayer = new Map(
    team.lineup?.players.map((player) => [player.id, player.role]) ?? [],
  );
  const captainId =
    team.lineup?.captainId ??
    team.lineup?.players.find((player) => player.isCaptain)?.id ??
    "";
  const goalkeeperId =
    team.lineup?.goalkeeperId ??
    team.lineup?.players.find((player) => player.isGoalkeeper)?.id ??
    "";
  const startersCount =
    team.lineup?.players.filter((player) => player.role === "STARTER").length ??
    0;
  const substitutesCount =
    team.lineup?.players.filter((player) => player.role === "SUBSTITUTE")
      .length ?? 0;

  return (
    <form action={saveMatchLineupAction} className="rounded-xl border border-slate-200">
      <input type="hidden" name="matchId" value={matchId} />
      <input
        type="hidden"
        name="competitionTeamId"
        value={team.competitionTeamId}
      />

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-950">
            {team.name} ({team.shortName})
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            {sideLabel} - {startersCount} starters - {substitutesCount} subs
          </p>
        </div>
        <button
          type="submit"
          disabled={!databaseReady || team.squad.length === 0}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-700 px-3 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <FiSave className="h-3.5 w-3.5" />
          Save
        </button>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <label className="grid gap-1.5 text-xs font-bold text-slate-700">
          Formation
          <input
            name="formation"
            defaultValue={team.lineup?.formation ?? ""}
            placeholder="4-3-3"
            disabled={!databaseReady}
            className="h-10 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-slate-700">
          Captain
          <select
            name="captainId"
            defaultValue={captainId}
            disabled={!databaseReady || team.squad.length === 0}
            className="h-10 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
          >
            <option value="">None</option>
            {team.squad.map((player) => (
              <option key={player.id} value={player.id}>
                #{player.number} {player.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-slate-700">
          Goalkeeper
          <select
            name="goalkeeperId"
            defaultValue={goalkeeperId}
            disabled={!databaseReady || team.squad.length === 0}
            className="h-10 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
          >
            <option value="">None</option>
            {team.squad.map((player) => (
              <option key={player.id} value={player.id}>
                #{player.number} {player.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="border-t border-slate-100">
        {team.squad.length > 0 ? (
          <div className="max-h-[28rem] overflow-auto divide-y divide-slate-100">
            {team.squad.map((player) => (
              <div
                key={player.id}
                className="grid grid-cols-[minmax(0,1fr)_8.5rem] items-center gap-3 px-4 py-2.5"
              >
                <input type="hidden" name="squadPlayerIds" value={player.id} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">
                    #{player.number} {player.name}
                  </p>
                  <p className="truncate text-[11px] font-semibold text-slate-400">
                    {player.position} - {player.category}
                  </p>
                </div>
                <select
                  name={`role:${player.id}`}
                  defaultValue={roleByPlayer.get(player.id) ?? ""}
                  disabled={!databaseReady}
                  className="h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold outline-none focus:border-blue-600 disabled:bg-slate-100"
                >
                  <option value="">Out</option>
                  <option value="STARTER">Starter</option>
                  <option value="SUBSTITUTE">Substitute</option>
                </select>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-6 text-center text-xs font-bold text-slate-400">
            No registered players.
          </p>
        )}
      </div>
    </form>
  );
}

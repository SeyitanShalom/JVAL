import Link from "next/link";
import {
  FiActivity,
  FiCalendar,
  FiClock,
  FiExternalLink,
  FiMapPin,
  FiZap,
} from "react-icons/fi";
import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "../../components/AdminModalButtons";
import TournamentDrawModal from "../../components/TournamentDrawModal";
import TournamentSimulationModal from "../../components/TournamentSimulationModal";
import {
  getAdminFixtureData,
  type AdminMatchRecord,
} from "@/lib/admin-fixtures";
import { getAdminCompetitionData } from "@/lib/admin-competitions";
import { createFixture, deleteFixture, updateFixture } from "./actions";
import { simulateMatchAction } from "./simulation-actions";
import LiveMatchClock from "@/app/components/LiveMatchClock";

const STATUS_TONE = {
  UPCOMING: "slate",
  LIVE: "red",
  HALFTIME: "amber",
  PENALTIES: "red",
  FULLTIME: "green",
  POSTPONED: "amber",
  // legacy static fallbacks
  live: "red",
  upcoming: "slate",
  finished: "green",
  postponed: "amber",
} as const;

const MATCHDAY_OPTIONS = [
  "Matchday 1",
  "Matchday 2",
  "Matchday 3",
  "Matchday 4",
  "Matchday 5",
  "Matchday 6",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "3rd Place",
  "Final",
];

export default async function AdminFixturesPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    pots_drawn?: string;
    fixtures_generated?: string;
    knockout_generated?: string;
    supercup_seeded?: string;
    fixtures_cleared?: string;
    simulated?: string;
    batch_simulated?: string;
    tournament_simulated?: string;
    sim_reset?: string;
    error?: string;
  }>;
}) {
  const [query, fixtureData, competitionData] = await Promise.all([
    searchParams,
    getAdminFixtureData(),
    getAdminCompetitionData(),
  ]);

  const canWrite = fixtureData.databaseReady;
  const message = getPageMessage(query, fixtureData.error);

  const penaltyMatches = fixtureData.matches.filter(
    (m) => m.homePenaltyScore !== null || m.awayPenaltyScore !== null,
  );
  const liveMatches = fixtureData.matches.filter((m) =>
    ["LIVE", "HALFTIME", "PENALTIES"].includes(m.status),
  );
  const groupedMatches = groupAdminMatchesByDate(fixtureData.matches);
  const lastSyncedLabel = fixtureData.lastSyncedAt
    ? new Date(fixtureData.lastSyncedAt).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Sample data";

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Match Operations"
        title="Fixtures and live controls"
        description="Schedule neutral-venue fixtures, update match status, publish results, and record live match events."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <TournamentSimulationModal
              competitions={competitionData.competitions.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
                plannedTeams: c.plannedTeams,
              }))}
              canWrite={canWrite}
            />
            <TournamentDrawModal
              competitions={competitionData.competitions.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
                plannedTeams: c.plannedTeams,
              }))}
              canWrite={canWrite}
            />
            <AddButton
              label="Fixture"
              title="Schedule Fixture"
              description="Add a new match to the fixture list."
            >
              <FixtureForm
                action={createFixture}
                canWrite={canWrite}
                competitionOptions={competitionData.competitions}
                venueOptions={fixtureData.venueOptions}
                teamOptions={fixtureData.teamOptions}
              />
            </AddButton>
          </div>
        }
      />

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-bold ${message.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Fixtures"
          value={fixtureData.matches.length}
          detail={
            fixtureData.source === "database" ? "Database" : "Sample preview"
          }
        />
        <MetricCard
          label="Live now"
          value={fixtureData.liveCount}
          detail="In progress"
        />
        <MetricCard
          label="Fulltime"
          value={fixtureData.finishedCount}
          detail="Results stored"
        />
        <MetricCard
          label="Activity"
          value={fixtureData.recentActivities.length}
          detail={lastSyncedLabel}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {/* Match schedule */}
        <AdminPanel title="Match Schedule">
          <div className="grid gap-4">
            {groupedMatches.map((group) => (
              <section
                key={group.key}
                className="overflow-hidden rounded-lg border border-slate-200"
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <FiCalendar
                      className="h-4 w-4 shrink-0 text-red-500"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-950">
                        {group.label}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        {group.matches.length} fixture
                        {group.matches.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.matches.map((match) => (
                    <AdminFixtureCard
                      key={match.id}
                      match={match}
                      canWrite={canWrite}
                    />
                  ))}
                </div>
              </section>
            ))}
            {fixtureData.matches.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 p-10 text-center">
                <p className="text-sm font-bold text-slate-500">
                  No fixtures yet.{" "}
                  <span className="text-red-500">
                    Click &quot;Tournament Draw &amp; Fixture Generator&quot; or
                    &quot;+ Fixture&quot; to schedule matches.
                  </span>
                </p>
              </div>
            )}
          </div>
        </AdminPanel>

        {/* Live controls */}
        <div className="grid gap-6 content-start">
          <AdminPanel title="Live Match Operations">
            {liveMatches.length > 0 ? (
              <div className="grid gap-2">
                {liveMatches.map((match) => (
                  <div
                    key={match.id}
                    className="rounded-lg border border-red-200 bg-red-50/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {match.homeTeamShort} vs {match.awayTeamShort}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                          {match.homeScore ?? 0}:{match.awayScore ?? 0} -{" "}
                          {match.competitionName}
                        </p>
                      </div>
                      <LiveMatchClock
                        status={match.status}
                        minute={match.minuteLabel}
                        currentPeriod={match.currentPeriod}
                        firstHalfStartedAt={match.firstHalfStartedAt}
                        secondHalfStartedAt={match.secondHalfStartedAt}
                        variant="badge"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/fixtures/${match.id}/live`}
                        className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-600"
                      >
                        <FiActivity
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        Console
                      </Link>
                      <Link
                        href={`/matches/${match.slug}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-500 shadow-sm transition hover:bg-red-50"
                      >
                        <FiExternalLink
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        Public
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-400">
                No matches currently live.
              </p>
            )}
          </AdminPanel>

          <AdminPanel title="Recent Match Activity">
            {fixtureData.recentActivities.length > 0 ? (
              <div className="grid gap-2">
                {fixtureData.recentActivities.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/matches/${activity.matchSlug}`}
                    className="group rounded-lg border border-slate-200 p-3 transition hover:border-red-300 hover:bg-red-50/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-950">
                          {formatAdminActivityType(activity.type)} -{" "}
                          {activity.playerName}
                        </p>
                        <p className="mt-1 truncate text-[11px] font-semibold text-slate-500">
                          {activity.minuteLabel} - {activity.teamShort} -{" "}
                          {activity.matchLabel}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
                          {activity.competitionName}
                        </p>
                      </div>
                      <FiExternalLink
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-red-500"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-400">
                No match activity has been logged yet.
              </p>
            )}
          </AdminPanel>

          {/* Penalties panel */}
          {penaltyMatches.length > 0 && (
            <AdminPanel title="Penalty Shootouts">
              <div className="grid gap-3">
                {penaltyMatches.map((match) => (
                  <article
                    key={match.id}
                    className="rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">
                          {match.homeTeamShort} vs {match.awayTeamShort}
                        </p>
                        <p className="text-xs font-bold text-slate-500">
                          {match.competitionName}
                        </p>
                      </div>
                      <AdminStatusBadge tone="blue">
                        {match.homePenaltyScore}-{match.awayPenaltyScore}
                      </AdminStatusBadge>
                    </div>
                  </article>
                ))}
              </div>
            </AdminPanel>
          )}
        </div>
      </section>
    </div>
  );
}

// --- Sub-components -----------------------------------------------------------

const adminDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Africa/Lagos",
  year: "numeric",
});

const adminDateLabelFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "Africa/Lagos",
  weekday: "long",
  year: "numeric",
});

function groupAdminMatchesByDate(matches: AdminMatchRecord[]) {
  const groups = new Map<
    string,
    { key: string; label: string; matches: AdminMatchRecord[] }
  >();

  for (const match of matches) {
    const date = new Date(match.kickoffAt);
    const key = adminDateKeyFormatter.format(date);
    const label = adminDateLabelFormatter.format(date);
    const group = groups.get(key) ?? { key, label, matches: [] };
    group.matches.push(match);
    groups.set(key, group);
  }

  return Array.from(groups.values());
}

function formatAdminMatchTime(date: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}

function formatAdminStatus(status: string) {
  const labels: Record<string, string> = {
    UPCOMING: "Upcoming",
    LIVE: "Live",
    HALFTIME: "Half-time",
    PENALTIES: "Penalties",
    FULLTIME: "Full-time",
    POSTPONED: "Postponed",
    upcoming: "Upcoming",
    live: "Live",
    finished: "Full-time",
    postponed: "Postponed",
  };

  return labels[status] ?? status;
}

function formatAdminActivityType(type: string) {
  const labels: Record<string, string> = {
    GOAL: "Goal",
    ASSIST: "Assist",
    YELLOW_CARD: "Yellow card",
    RED_CARD: "Red card",
    SUBSTITUTION: "Substitution",
    PENALTY_SCORED: "Penalty scored",
    PENALTY_MISSED: "Penalty missed",
    OWN_GOAL: "Own goal",
    DISALLOWED_GOAL: "Disallowed goal",
    INJURY_UPDATE: "Injury update",
    NOTE: "Note",
    Goal: "Goal",
    Assist: "Assist",
    "Yellow card": "Yellow card",
    "Red card": "Red card",
    Substitution: "Substitution",
    "Penalty scored": "Penalty scored",
    "Penalty missed": "Penalty missed",
    "Own goal": "Own goal",
  };

  return labels[type] ?? type.replace(/_/g, " ").toLowerCase();
}

function AdminFixtureCard({
  match,
  canWrite,
}: {
  match: AdminMatchRecord;
  canWrite: boolean;
}) {
  const tone = STATUS_TONE[match.status as keyof typeof STATUS_TONE] ?? "slate";
  const isLive = ["LIVE", "HALFTIME", "PENALTIES", "live"].includes(
    match.status,
  );
  const isUpcoming = match.status === "UPCOMING" || match.status === "upcoming";
  const hasScore = match.homeScore !== null && match.awayScore !== null;
  const kickoffTime = formatAdminMatchTime(match.kickoffAt);
  const scoreText = hasScore ? `${match.homeScore}:${match.awayScore}` : "-:-";

  return (
    <article className="grid gap-3 p-3 lg:grid-cols-[5rem_minmax(0,1fr)_4.75rem_minmax(0,1fr)_auto] lg:items-center">
      <div className="flex items-center justify-between gap-2 lg:block">
        <time className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 tabular-nums">
          <FiClock className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
          {kickoffTime}
        </time>
        {isLive ? (
          <LiveMatchClock
            status={match.status}
            minute={match.minuteLabel}
            currentPeriod={match.currentPeriod}
            firstHalfStartedAt={match.firstHalfStartedAt}
            secondHalfStartedAt={match.secondHalfStartedAt}
            variant="badge"
            className="lg:mt-1"
          />
        ) : (
          <AdminStatusBadge tone={tone}>
            {formatAdminStatus(match.status)}
          </AdminStatusBadge>
        )}
      </div>

      <AdminFixtureTeam
        name={match.homeTeamName}
        shortName={match.homeTeamShort}
        align="left"
      />

      <p
        className={`mx-auto min-w-[4.25rem] rounded-md px-2.5 py-1.5 text-center text-sm font-bold tabular-nums ${
          isLive
            ? "bg-red-600 text-white"
            : hasScore
              ? "bg-slate-950 text-white"
              : "bg-slate-100 text-slate-500"
        }`}
      >
        {scoreText}
        {match.homePenaltyScore !== null && match.awayPenaltyScore !== null ? (
          <span className="mt-0.5 block text-[10px] font-semibold opacity-80">
            {match.homePenaltyScore}-{match.awayPenaltyScore} pens
          </span>
        ) : null}
      </p>

      <AdminFixtureTeam
        name={match.awayTeamName}
        shortName={match.awayTeamShort}
        align="right"
      />

      <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
        <div className="mr-auto min-w-0 text-[11px] font-semibold text-slate-500 lg:mr-0 lg:text-right">
          <p className="truncate font-bold text-slate-800">{match.matchday}</p>
          <p className="truncate">{match.competitionName}</p>
          <p className="inline-flex min-w-0 items-center gap-1 truncate lg:justify-end">
            <FiMapPin
              className="h-3 w-3 shrink-0 text-blue-500"
              aria-hidden="true"
            />
            <span className="truncate">{match.venueName}</span>
          </p>
        </div>

        {isUpcoming && canWrite && (
          <form action={simulateMatchAction.bind(null, match.id)}>
            <button
              type="submit"
              title="Simulate match result with events"
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-bold text-amber-800 shadow-sm transition hover:bg-amber-100"
            >
              <FiZap className="h-3.5 w-3.5" />
              Simulate
            </button>
          </form>
        )}
        <Link
          href={`/admin/fixtures/${match.id}/live`}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-500 shadow-sm transition hover:bg-red-100"
          title="Open live match console"
        >
          <FiActivity className="h-3.5 w-3.5" />
          Console
        </Link>
        <Link
          href={`/matches/${match.slug}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-red-300 hover:text-red-500"
          title="View public match page"
        >
          <FiExternalLink className="h-3.5 w-3.5" />
        </Link>
        <EditButton
          title={`Edit - ${match.homeTeamShort} vs ${match.awayTeamShort}`}
          compact
        >
          <FixtureEditForm
            match={match}
            action={updateFixture.bind(null, match.id)}
            canWrite={canWrite}
          />
        </EditButton>
        <DeleteButton
          title="Remove Fixture"
          itemLabel={`${match.homeTeamName} vs ${match.awayTeamName}`}
          action={deleteFixture.bind(null, match.id)}
          disabled={!canWrite}
        />
      </div>
    </article>
  );
}

function AdminFixtureTeam({
  name,
  shortName,
  align,
}: {
  name: string;
  shortName: string;
  align: "left" | "right";
}) {
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <p className="truncate text-sm font-bold text-slate-950">{name}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {shortName}
      </p>
    </div>
  );
}

function FixtureForm({
  action,
  canWrite,
  competitionOptions,
  venueOptions,
  teamOptions,
}: {
  action: (fd: FormData) => Promise<void>;
  canWrite: boolean;
  competitionOptions: { id: string; name: string }[];
  venueOptions: { id: string; name: string; location?: string }[];
  teamOptions: {
    competitionTeamId: string;
    competitionId: string;
    teamId: string;
    teamName: string;
    shortName: string;
  }[];
}) {
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Competition
        <select
          name="competitionId"
          disabled={!canWrite || competitionOptions.length === 0}
          className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
        >
          {competitionOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Home Team
          <select
            name="homeCompetitionTeamId"
            disabled={!canWrite || teamOptions.length === 0}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
          >
            <option value="">Select Home Team...</option>
            {teamOptions.map((t) => (
              <option
                key={`home-${t.competitionTeamId}`}
                value={t.competitionTeamId}
              >
                {t.teamName} ({t.shortName})
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Away Team
          <select
            name="awayCompetitionTeamId"
            disabled={!canWrite || teamOptions.length === 0}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
          >
            <option value="">Select Away Team...</option>
            {teamOptions.map((t) => (
              <option
                key={`away-${t.competitionTeamId}`}
                value={t.competitionTeamId}
              >
                {t.teamName} ({t.shortName})
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Venue
        <select
          name="venueId"
          disabled={!canWrite || venueOptions.length === 0}
          className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
        >
          {venueOptions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} {v.location ? `(${v.location})` : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Matchday / Round
          <select
            name="matchday"
            disabled={!canWrite}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
          >
            {MATCHDAY_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Kickoff date &amp; time
          <input
            type="datetime-local"
            name="kickoffAt"
            required
            disabled={!canWrite}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
          />
        </label>
      </div>

      {!canWrite && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Connect Supabase in <code>.env</code> to enable writes.
        </p>
      )}
      <button
        type="submit"
        disabled={!canWrite}
        className="h-11 rounded-lg bg-red-500 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Schedule fixture
      </button>
    </form>
  );
}

function FixtureEditForm({
  match,
  action,
  canWrite,
}: {
  match: {
    status: string;
    matchday: string;
    kickoffAt: string;
    venueId: string;
    homeScore: number | null;
    awayScore: number | null;
    homePenaltyScore: number | null;
    awayPenaltyScore: number | null;
  };
  action: (fd: FormData) => Promise<void>;
  canWrite: boolean;
}) {
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Status
          <select
            name="status"
            defaultValue={match.status}
            disabled={!canWrite}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
          >
            <option value="UPCOMING">Upcoming</option>
            <option value="LIVE">Live</option>
            <option value="HALFTIME">Half-time</option>
            <option value="PENALTIES">Penalties</option>
            <option value="FULLTIME">Full-time</option>
            <option value="POSTPONED">Postponed</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Matchday
          <select
            name="matchday"
            defaultValue={match.matchday}
            disabled={!canWrite}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
          >
            {MATCHDAY_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Kickoff
        <input
          type="datetime-local"
          name="kickoffAt"
          defaultValue={match.kickoffAt.slice(0, 16)}
          disabled={!canWrite}
          className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Home score
          <input
            type="number"
            name="homeScore"
            min={0}
            defaultValue={match.homeScore ?? ""}
            disabled={!canWrite}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
            placeholder="-"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Away score
          <input
            type="number"
            name="awayScore"
            min={0}
            defaultValue={match.awayScore ?? ""}
            disabled={!canWrite}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
            placeholder="-"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Home penalties
          <input
            type="number"
            name="homePenalty"
            min={0}
            defaultValue={match.homePenaltyScore ?? ""}
            disabled={!canWrite}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
            placeholder="-"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Away penalties
          <input
            type="number"
            name="awayPenalty"
            min={0}
            defaultValue={match.awayPenaltyScore ?? ""}
            disabled={!canWrite}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
            placeholder="-"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Referee (optional)
        <input
          name="referee"
          disabled={!canWrite}
          className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
          placeholder="Referee name"
        />
      </label>
      {!canWrite && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Connect Supabase to enable writes.
        </p>
      )}
      <button
        type="submit"
        disabled={!canWrite}
        className="h-11 rounded-lg bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Save changes
      </button>
    </form>
  );
}

function getPageMessage(
  query: {
    created?: string;
    updated?: string;
    deleted?: string;
    pots_drawn?: string;
    fixtures_generated?: string;
    knockout_generated?: string;
    supercup_seeded?: string;
    fixtures_cleared?: string;
    simulated?: string;
    batch_simulated?: string;
    tournament_simulated?: string;
    sim_reset?: string;
    error?: string;
  },
  fallbackError?: string,
) {
  if (query.created)
    return { tone: "success" as const, text: "Fixture scheduled." };
  if (query.updated)
    return { tone: "success" as const, text: "Fixture updated." };
  if (query.deleted)
    return { tone: "success" as const, text: "Fixture removed." };
  if (query.pots_drawn)
    return {
      tone: "success" as const,
      text: "?? Teams distributed into Pots 1-4 successfully.",
    };
  if (query.fixtures_generated)
    return {
      tone: "success" as const,
      text: "?? Group stage fixtures generated across neutral venues.",
    };
  if (query.knockout_generated)
    return {
      tone: "success" as const,
      text: "?? Knockout stage bracket (Quarter-finals to Final) generated.",
    };
  if (query.supercup_seeded)
    return {
      tone: "success" as const,
      text: "?? 32-team Super Cup roster seeded from Top 8 LGA qualifiers.",
    };
  if (query.fixtures_cleared)
    return {
      tone: "success" as const,
      text: "Unplayed fixtures reset/cleared.",
    };
  if (query.simulated)
    return {
      tone: "success" as const,
      text: "? Match simulated to Full-time with realistic events & standings recalculated.",
    };
  if (query.batch_simulated)
    return {
      tone: "success" as const,
      text: "? Selected matchday fixtures simulated & standings updated.",
    };
  if (query.tournament_simulated)
    return {
      tone: "success" as const,
      text: "?? Full tournament simulated end-to-end (Group stage -> Knockout bracket -> Champion crowned)!",
    };
  if (query.sim_reset)
    return {
      tone: "success" as const,
      text: "?? Matches reset to Upcoming and standings zeroed.",
    };

  if (query.error === "missing")
    return {
      tone: "warning" as const,
      text: "Competition, venue, matchday and kickoff time are required.",
    };
  if (query.error === "database")
    return { tone: "warning" as const, text: "Database not connected." };
  if (query.error === "no_teams")
    return {
      tone: "warning" as const,
      text: "This competition has no registered teams yet.",
    };
  if (query.error === "no_venues")
    return {
      tone: "warning" as const,
      text: "At least one venue is required to schedule fixtures.",
    };
  if (query.error === "need_8_teams")
    return {
      tone: "warning" as const,
      text: "Exactly 8 teams required to generate Quarter-finals.",
    };
  if (query.error === "pot_save")
    return {
      tone: "warning" as const,
      text: "Could not save pot distribution.",
    };
  if (query.error === "fixture_gen_failed")
    return {
      tone: "warning" as const,
      text: "Could not generate group fixtures.",
    };
  if (query.error === "knockout_gen_failed")
    return {
      tone: "warning" as const,
      text: "Could not generate knockout bracket.",
    };
  if (query.error === "supercup_seed_failed")
    return {
      tone: "warning" as const,
      text: "Could not seed Super Cup from LGA standings.",
    };
  if (query.error === "clear_failed")
    return { tone: "warning" as const, text: "Could not clear fixtures." };
  if (query.error === "sim_failed")
    return {
      tone: "warning" as const,
      text: "Simulation could not be completed.",
    };
  if (query.error === "no_upcoming_matches")
    return {
      tone: "warning" as const,
      text: "No upcoming fixtures found for this selection.",
    };
  if (query.error === "reset_failed")
    return { tone: "warning" as const, text: "Could not reset matches." };
  if (query.error === "save")
    return { tone: "warning" as const, text: "Could not save fixture." };
  if (query.error === "delete")
    return {
      tone: "warning" as const,
      text: "Could not delete fixture - it may have events or lineups.",
    };
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}

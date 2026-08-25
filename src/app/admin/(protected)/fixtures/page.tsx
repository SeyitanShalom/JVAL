import Link from "next/link";
import { FiActivity, FiRadio, FiZap } from "react-icons/fi";
import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { AddButton, DeleteButton, EditButton } from "../../components/AdminModalButtons";
import TournamentDrawModal from "../../components/TournamentDrawModal";
import TournamentSimulationModal from "../../components/TournamentSimulationModal";
import { liveControlEvents } from "@/lib/admin-dashboard-data";
import { getAdminFixtureData } from "@/lib/admin-fixtures";
import { getAdminCompetitionData } from "@/lib/admin-competitions";
import { createFixture, deleteFixture, updateFixture } from "./actions";
import { simulateMatchAction } from "./simulation-actions";

const STATUS_TONE = {
  UPCOMING: "slate",
  LIVE: "blue",
  HALFTIME: "amber",
  FULLTIME: "green",
  POSTPONED: "amber",
  // legacy static fallbacks
  live: "blue",
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
    (m) => m.homePenaltyScore !== null || m.awayPenaltyScore !== null
  );
  const liveMatches = fixtureData.matches.filter(
    (m) => m.status === "LIVE" || m.status === "HALFTIME"
  );

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
            <AddButton label="Fixture" title="Schedule Fixture" description="Add a new match to the fixture list.">
              <FixtureForm
                action={createFixture}
                canWrite={canWrite}
                competitionOptions={competitionData.competitions}
                venueOptions={[]}
              />
            </AddButton>
          </div>
        }
      />

      {message ? (
        <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${message.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {message.text}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Fixtures" value={fixtureData.matches.length} detail={fixtureData.source === "database" ? "Database" : "Sample preview"} />
        <MetricCard label="Live now" value={fixtureData.liveCount} detail="In progress" />
        <MetricCard label="Fulltime" value={fixtureData.finishedCount} detail="Results stored" />
        <MetricCard label="Penalty records" value={fixtureData.penaltyCount} detail="Taker by taker" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        {/* Match schedule */}
        <AdminPanel title="Match Schedule">
          <div className="grid gap-3">
            {fixtureData.matches.map((match) => {
              const tone = STATUS_TONE[match.status as keyof typeof STATUS_TONE] ?? "slate";
              const isUpcoming = match.status === "UPCOMING" || match.status === "upcoming";
              return (
                <article key={match.id} className="min-w-0 rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-slate-950">
                        {match.homeTeamName} <span className="text-slate-400">vs</span> {match.awayTeamName}
                      </p>
                      <p className="mt-1 break-all text-xs font-bold text-slate-400">{match.competitionName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AdminStatusBadge tone={tone}>{match.status}</AdminStatusBadge>
                      <p className="min-w-[2.5rem] text-center text-lg font-bold text-slate-950 tabular-nums">
                        {match.homeScore ?? "—"}:{match.awayScore ?? "—"}
                      </p>
                      {isUpcoming && canWrite && (
                        <form action={simulateMatchAction.bind(null, match.id)}>
                          <button
                            type="submit"
                            title="Simulate Match Result with Realistic Events"
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-bold text-amber-800 shadow-sm transition hover:bg-amber-100"
                          >
                            <FiZap className="h-3.5 w-3.5" />
                            Simulate
                          </button>
                        </form>
                      )}
                      <Link
                        href={`/admin/fixtures/${match.id}/live`}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100"
                        title="Open Live Match Console"
                      >
                        <FiActivity className="h-3.5 w-3.5" />
                        Live Console
                      </Link>
                      <EditButton
                        title={`Edit — ${match.homeTeamShort} vs ${match.awayTeamShort}`}
                        compact
                      >
                        <FixtureEditForm
                          match={match}
                          action={updateFixture.bind(null, match.id)}
                          canWrite={canWrite}
                          competitionOptions={competitionData.competitions}
                        />
                      </EditButton>
                      <DeleteButton
                        title="Remove Fixture"
                        itemLabel={`${match.homeTeamName} vs ${match.awayTeamName}`}
                        action={deleteFixture.bind(null, match.id)}
                        disabled={!canWrite}
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm lg:grid-cols-4">
                    <FixtureMeta label="Competition" value={match.competitionName} />
                    <FixtureMeta label="Round" value={match.matchday} />
                    <FixtureMeta
                      label="Kickoff"
                      value={new Date(match.kickoffAt).toLocaleString("en-GB", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    />
                    <FixtureMeta label="Venue" value={match.venueName} />
                  </div>

                  {match.homePenaltyScore !== null && match.awayPenaltyScore !== null && (
                    <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                      Penalties: {match.homePenaltyScore}–{match.awayPenaltyScore}
                    </p>
                  )}
                </article>
              );
            })}
            {fixtureData.matches.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
                <p className="text-sm font-bold text-slate-500">
                  No fixtures yet.{" "}
                  <span className="text-blue-600">Click &quot;Tournament Draw &amp; Fixture Generator&quot; or &quot;+ Fixture&quot; to schedule matches.</span>
                </p>
              </div>
            )}
          </div>
        </AdminPanel>

        {/* Live controls */}
        <div className="grid gap-6 content-start">
          <AdminPanel title="Live Event Controls">
            {liveMatches.length > 0 ? (
              <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                <FiRadio className="mr-1 inline" aria-hidden="true" />
                {liveMatches.length} match{liveMatches.length !== 1 ? "es" : ""} live
              </p>
            ) : (
              <p className="mb-3 text-xs font-semibold text-slate-400">No matches currently live.</p>
            )}
            <div className="grid gap-2">
              {liveControlEvents.map((event) => (
                <button
                  key={event}
                  type="button"
                  className="flex h-11 items-center justify-between rounded-lg border border-slate-200 px-3 text-left text-sm font-bold text-slate-700 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  {event}
                  <FiActivity aria-hidden="true" className="shrink-0 text-blue-600" />
                </button>
              ))}
            </div>
          </AdminPanel>

          {/* Penalties panel */}
          {penaltyMatches.length > 0 && (
            <AdminPanel title="Penalty Shootouts">
              <div className="grid gap-3">
                {penaltyMatches.map((match) => (
                  <article key={match.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">
                          {match.homeTeamShort} vs {match.awayTeamShort}
                        </p>
                        <p className="text-xs font-bold text-slate-500">{match.competitionName}</p>
                      </div>
                      <AdminStatusBadge tone="blue">
                        {match.homePenaltyScore}–{match.awayPenaltyScore}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function FixtureForm({
  action,
  canWrite,
  competitionOptions,
  venueOptions,
}: {
  action: (fd: FormData) => Promise<void>;
  canWrite: boolean;
  competitionOptions: { id: string; name: string }[];
  venueOptions: { id: string; name: string }[];
}) {
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Competition
        <select name="competitionId" disabled={!canWrite || competitionOptions.length === 0} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100">
          {competitionOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Matchday / Round
          <select name="matchday" disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100">
            {MATCHDAY_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Kickoff date &amp; time
          <input type="datetime-local" name="kickoffAt" disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Venue ID
        <input name="venueId" disabled={!canWrite} placeholder="Venue ID (from Venues page)" className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100" />
      </label>
      {!canWrite && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Connect Supabase in <code>.env</code> to enable writes.</p>}
      <button type="submit" disabled={!canWrite} className="h-11 rounded-lg bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">Schedule fixture</button>
    </form>
  );
}

function FixtureEditForm({
  match,
  action,
  canWrite,
  competitionOptions,
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
  competitionOptions: { id: string; name: string }[];
}) {
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Status
          <select name="status" defaultValue={match.status} disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100">
            <option value="UPCOMING">Upcoming</option>
            <option value="LIVE">Live</option>
            <option value="HALFTIME">Half-time</option>
            <option value="FULLTIME">Full-time</option>
            <option value="POSTPONED">Postponed</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Matchday
          <select name="matchday" defaultValue={match.matchday} disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100">
            {MATCHDAY_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
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
          <input type="number" name="homeScore" min={0} defaultValue={match.homeScore ?? ""} disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100" placeholder="—" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Away score
          <input type="number" name="awayScore" min={0} defaultValue={match.awayScore ?? ""} disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100" placeholder="—" />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Home penalties
          <input type="number" name="homePenalty" min={0} defaultValue={match.homePenaltyScore ?? ""} disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100" placeholder="—" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Away penalties
          <input type="number" name="awayPenalty" min={0} defaultValue={match.awayPenaltyScore ?? ""} disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100" placeholder="—" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Referee (optional)
        <input name="referee" disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100" placeholder="Referee name" />
      </label>
      {!canWrite && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Connect Supabase to enable writes.</p>}
      <button type="submit" disabled={!canWrite} className="h-11 rounded-lg bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">Save changes</button>
    </form>
  );
}

function FixtureMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-700">{value}</p>
    </div>
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
  fallbackError?: string
) {
  if (query.created) return { tone: "success" as const, text: "Fixture scheduled." };
  if (query.updated) return { tone: "success" as const, text: "Fixture updated." };
  if (query.deleted) return { tone: "success" as const, text: "Fixture removed." };
  if (query.pots_drawn) return { tone: "success" as const, text: "🎲 Teams distributed into Pots 1–4 successfully." };
  if (query.fixtures_generated) return { tone: "success" as const, text: "📅 Group stage fixtures generated across neutral venues." };
  if (query.knockout_generated) return { tone: "success" as const, text: "⚔️ Knockout stage bracket (Quarter-finals to Final) generated." };
  if (query.supercup_seeded) return { tone: "success" as const, text: "🏆 32-team Super Cup roster seeded from Top 8 LGA qualifiers." };
  if (query.fixtures_cleared) return { tone: "success" as const, text: "Unplayed fixtures reset/cleared." };
  if (query.simulated) return { tone: "success" as const, text: "⚡ Match simulated to Full-time with realistic events & standings recalculated." };
  if (query.batch_simulated) return { tone: "success" as const, text: "⚡ Selected matchday fixtures simulated & standings updated." };
  if (query.tournament_simulated) return { tone: "success" as const, text: "🏆 Full tournament simulated end-to-end (Group stage -> Knockout bracket -> Champion crowned)!" };
  if (query.sim_reset) return { tone: "success" as const, text: "🔄 Matches reset to Upcoming and standings zeroed." };

  if (query.error === "missing") return { tone: "warning" as const, text: "Competition, venue, matchday and kickoff time are required." };
  if (query.error === "database") return { tone: "warning" as const, text: "Database not connected." };
  if (query.error === "no_teams") return { tone: "warning" as const, text: "This competition has no registered teams yet." };
  if (query.error === "no_venues") return { tone: "warning" as const, text: "At least one venue is required to schedule fixtures." };
  if (query.error === "need_8_teams") return { tone: "warning" as const, text: "Exactly 8 teams required to generate Quarter-finals." };
  if (query.error === "pot_save") return { tone: "warning" as const, text: "Could not save pot distribution." };
  if (query.error === "fixture_gen_failed") return { tone: "warning" as const, text: "Could not generate group fixtures." };
  if (query.error === "knockout_gen_failed") return { tone: "warning" as const, text: "Could not generate knockout bracket." };
  if (query.error === "supercup_seed_failed") return { tone: "warning" as const, text: "Could not seed Super Cup from LGA standings." };
  if (query.error === "clear_failed") return { tone: "warning" as const, text: "Could not clear fixtures." };
  if (query.error === "sim_failed") return { tone: "warning" as const, text: "Simulation could not be completed." };
  if (query.error === "no_upcoming_matches") return { tone: "warning" as const, text: "No upcoming fixtures found for this selection." };
  if (query.error === "reset_failed") return { tone: "warning" as const, text: "Could not reset matches." };
  if (query.error === "save") return { tone: "warning" as const, text: "Could not save fixture." };
  if (query.error === "delete") return { tone: "warning" as const, text: "Could not delete fixture — it may have events or lineups." };
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}

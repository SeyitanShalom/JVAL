import { FiActivity, FiPlus } from "react-icons/fi";
import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { liveControlEvents } from "@/lib/admin-dashboard-data";
import {
  formatDate,
  formatMatchTime,
  getCompetitionById,
  getTeamById,
  getVenueById,
  matches,
} from "@/lib/league-data";

const statusTone = {
  live: "blue",
  upcoming: "slate",
  finished: "green",
  postponed: "amber",
} as const;

export default function AdminFixturesPage() {
  const liveMatches = matches.filter((match) => match.status === "live");
  const finishedMatches = matches.filter((match) => match.status === "finished");
  const penaltyMatches = matches.filter((match) => match.penalties);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Match Operations"
        title="Fixtures and live controls"
        description="Schedule neutral-venue fixtures, update match status, publish results, and record live match events."
        action={
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white">
            <FiPlus aria-hidden="true" />
            Fixture
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Fixtures" value={matches.length} detail="All competitions" />
        <MetricCard label="Live" value={liveMatches.length} detail="In progress" />
        <MetricCard label="Fulltime" value={finishedMatches.length} detail="Results stored" />
        <MetricCard label="Penalty records" value={penaltyMatches.length} detail="Taker by taker" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <AdminPanel title="Match Schedule">
          <div className="grid gap-3">
            {matches.map((match) => (
              <article key={match.id} className="min-w-0 rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-black text-slate-950">
                      {getTeamById(match.homeTeamId)?.name} vs {getTeamById(match.awayTeamId)?.name}
                    </p>
                    <p className="mt-1 break-all text-xs font-bold text-slate-500">{match.slug}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:justify-end">
                    <AdminStatusBadge tone={statusTone[match.status]}>{match.status}</AdminStatusBadge>
                    <p className="text-lg font-black text-slate-950">
                      {match.homeScore ?? "-"}-{match.awayScore ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm lg:grid-cols-4">
                  <FixtureMeta label="Competition" value={getCompetitionById(match.competitionId)?.name ?? "-"} />
                  <FixtureMeta label="Round" value={match.matchday} />
                  <FixtureMeta label="Kickoff" value={`${formatDate(match.date)} ${formatMatchTime(match.date)}`} />
                  <FixtureMeta label="Venue" value={getVenueById(match.venueId)?.name ?? "-"} />
                </div>

                {match.penalties ? (
                  <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">
                    Penalties: {match.penalties.home}-{match.penalties.away}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Live Event Controls">
          <div className="grid gap-2">
            {liveControlEvents.map((event) => (
              <button
                key={event}
                type="button"
                className="flex h-11 items-center justify-between rounded-lg border border-slate-200 px-3 text-left text-sm font-black text-slate-700 transition hover:border-blue-600 hover:text-blue-700"
              >
                {event}
                <FiActivity aria-hidden="true" className="text-blue-600" />
              </button>
            ))}
          </div>
        </AdminPanel>
      </section>

      <AdminPanel title="Penalty Shootouts">
        <div className="grid gap-3 lg:grid-cols-2">
          {penaltyMatches.map((match) => (
            <article key={match.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {getTeamById(match.homeTeamId)?.name} vs {getTeamById(match.awayTeamId)?.name}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{getCompetitionById(match.competitionId)?.name}</p>
                </div>
                <AdminStatusBadge tone="blue">
                  {match.penalties?.home}-{match.penalties?.away}
                </AdminStatusBadge>
              </div>
              <div className="mt-4 grid gap-2">
                {match.penalties?.attempts.map((attempt, index) => (
                  <div key={`${attempt.teamId}-${attempt.order}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-bold text-slate-700">
                      Round {attempt.order}: {getTeamById(attempt.teamId)?.shortName}
                    </span>
                    <span className={`font-black ${attempt.scored ? "text-emerald-700" : "text-red-700"}`}>
                      {attempt.scored ? "Scored" : "Missed"}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}

function FixtureMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

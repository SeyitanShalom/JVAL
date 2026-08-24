import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { AdminPanel, MetricCard, ResourceCard } from "../components/AdminCards";
import AdminPageHeader from "../components/AdminPageHeader";
import { adminOverview, adminResources } from "@/lib/admin-dashboard-data";
import {
  formatDate,
  formatMatchTime,
  getCompetitionById,
  getTeamById,
  getVenueById,
} from "@/lib/league-data";

export default function AdminDashboardPage() {
  const nextFixtures = adminOverview.upcomingFixtures.slice(0, 4);
  const liveMatches = adminOverview.liveMatches.slice(0, 3);
  const recentNews = adminOverview.recentNews.slice(0, 4);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Current Season"
        title="Tournament control room"
        description={`${adminOverview.currentSeason.label} operations across competitions, fixtures, squads, statistics, news, galleries, awards, and records.`}
        action={
          <Link
            href="/admin/fixtures"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800"
          >
            <FiPlus aria-hidden="true" />
            Match update
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Live matches" value={adminOverview.liveMatches.length} detail="Polling-ready" />
        <MetricCard label="Upcoming fixtures" value={adminOverview.upcomingFixtures.length} detail="Scheduled" />
        <MetricCard label="Pending results" value={adminOverview.pendingResults.length} detail="Needs review" />
        <MetricCard label="Active competitions" value={adminOverview.activeCompetitions.length} detail={adminOverview.currentSeason.label} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {adminResources.map((resource) => (
          <ResourceCard key={resource.href} {...resource} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel title="Live Matches">
          <div className="grid gap-3">
            {liveMatches.length ? (
              liveMatches.map((match) => (
                <div key={match.id} className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                        {getCompetitionById(match.competitionId)?.name}
                      </p>
                      <p className="mt-1 text-base font-black text-slate-950">
                        {getTeamById(match.homeTeamId)?.shortName} {match.homeScore ?? 0} - {match.awayScore ?? 0}{" "}
                        {getTeamById(match.awayTeamId)?.shortName}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-black text-white">{match.minute}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {match.matchday} at {getVenueById(match.venueId)?.name}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm font-semibold text-slate-500">No live matches right now.</p>
            )}
          </div>
        </AdminPanel>

        <AdminPanel title="Upcoming Fixtures">
          <div className="divide-y divide-slate-100">
            {nextFixtures.map((match) => (
              <div key={match.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-950">
                    {getTeamById(match.homeTeamId)?.shortName} vs {getTeamById(match.awayTeamId)?.shortName}
                  </p>
                  <p className="text-xs font-black text-blue-600">{formatMatchTime(match.date)}</p>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {formatDate(match.date)} - {getCompetitionById(match.competitionId)?.name}
                </p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </section>

      <AdminPanel title="Recent News">
        <div className="grid gap-3 md:grid-cols-2">
          {recentNews.map((post) => (
            <Link
              key={post.id}
              href={`/admin/news?post=${post.slug}`}
              className="rounded-lg border border-slate-200 p-4 transition hover:border-blue-600"
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">
                {getCompetitionById(post.competitionId)?.name}
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">{post.title}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{formatDate(post.publishDate)}</p>
            </Link>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}

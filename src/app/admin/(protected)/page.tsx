import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { AdminPanel, MetricCard, ResourceCard } from "../components/AdminCards";
import AdminPageHeader from "../components/AdminPageHeader";
import LiveMatchClock from "@/app/components/LiveMatchClock";
import { getAdminDashboardMetrics, adminResources } from "@/lib/admin-dashboard-data";
import {
  formatDate,
  formatMatchTime,
  getCompetitionById,
  getTeamById,
  getVenueById,
  matches,
  newsPosts,
} from "@/lib/league-data";

export default async function AdminDashboardPage() {
  const metrics = await getAdminDashboardMetrics();

  // Still use static data for the fixture/news panels until those sections are DB-wired
  const nextFixtures = matches.filter((m) => m.status === "upcoming").slice(0, 4);
  const liveMatches = matches.filter((m) => m.status === "live").slice(0, 3);
  const recentNews = [...newsPosts]
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, 4);

  // Build resource cards with live DB counts
  const resources = [
    { title: "Competitions", href: "/admin/competitions", count: metrics.activeCompetitionCount, detail: "active competitions" },
    { title: "Fixtures", href: "/admin/fixtures", count: metrics.upcomingFixtureCount + metrics.liveMatchCount, detail: `${metrics.liveMatchCount} live` },
    { title: "Teams", href: "/admin/teams", count: metrics.teamCount, detail: "Squad limit 25" },
    { title: "Players", href: "/admin/players", count: metrics.totalPlayers, detail: "Current season" },
    { title: "Statistics", href: "/admin/statistics", count: metrics.totalPlayers + metrics.teamCount, detail: "Auto-calculated" },
    { title: "News", href: "/admin/news", count: metrics.newsCount, detail: "All posts" },
    { title: "Galleries", href: "/admin/galleries", count: metrics.galleryCount, detail: "All images" },
    { title: "Venues", href: "/admin/venues", count: metrics.venueCount, detail: "Neutral matches" },
    { title: "Awards", href: "/admin/awards-records", count: 0, detail: "Season tracked" },
  ];

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow={`Current Season · ${metrics.currentSeasonLabel}`}
        title="Tournament control room"
        description={`${metrics.currentSeasonLabel} operations across competitions, fixtures, squads, statistics, news, galleries, awards, and records.${metrics.source === "database" ? "" : " (Sample preview — connect Supabase to see live data.)"}`}
        action={
          <Link
            href="/admin/fixtures"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            <FiPlus aria-hidden="true" />
            Match update
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Live matches" value={metrics.liveMatchCount} detail="Polling-ready" />
        <MetricCard label="Upcoming fixtures" value={metrics.upcomingFixtureCount} detail="Scheduled" />
        <MetricCard label="Pending results" value={metrics.pendingResultCount} detail="Needs review" />
        <MetricCard label="Active competitions" value={metrics.activeCompetitionCount} detail={metrics.currentSeasonLabel} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {resources.map((resource) => (
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
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
                        {getCompetitionById(match.competitionId)?.name}
                      </p>
                      <p className="mt-1 text-base font-bold text-slate-950">
                        {getTeamById(match.homeTeamId)?.shortName} {match.homeScore ?? 0} -{" "}
                        {match.awayScore ?? 0} {getTeamById(match.awayTeamId)?.shortName}
                      </p>
                    </div>
                    <LiveMatchClock
                      status={match.status}
                      minute={match.minute}
                      variant="badge"
                    />
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
                  <p className="text-sm font-bold text-slate-950">
                    {getTeamById(match.homeTeamId)?.shortName} vs{" "}
                    {getTeamById(match.awayTeamId)?.shortName}
                  </p>
                  <p className="text-xs font-bold text-blue-600">{formatMatchTime(match.date)}</p>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {formatDate(match.date)} — {getCompetitionById(match.competitionId)?.name}
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
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                {getCompetitionById(post.competitionId)?.name}
              </p>
              <p className="mt-2 text-sm font-bold text-slate-950">{post.title}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{formatDate(post.publishDate)}</p>
            </Link>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}

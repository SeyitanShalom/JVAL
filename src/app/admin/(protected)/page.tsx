import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { AdminPanel, MetricCard, ResourceCard } from "../components/AdminCards";
import AdminPageHeader from "../components/AdminPageHeader";
import LiveMatchClock from "@/app/components/LiveMatchClock";
import { getAdminDashboardMetrics } from "@/lib/admin-dashboard-data";
import { getAdminFixtureData } from "@/lib/admin-fixtures";
import { getAdminNewsData } from "@/lib/admin-news";
import { formatDate, formatMatchTime } from "@/lib/league-data";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const [query, metrics, fixtureData, newsData] = await Promise.all([
    searchParams ? searchParams : Promise.resolve({} as { error?: string }),
    getAdminDashboardMetrics(),
    getAdminFixtureData(),
    getAdminNewsData(),
  ]);

  const nextFixtures = fixtureData.matches
    .filter((match) => match.status === "UPCOMING")
    .slice(0, 4);
  const liveMatches = fixtureData.matches
    .filter((match) => ["LIVE", "HALFTIME", "PENALTIES"].includes(match.status))
    .slice(0, 3);
  const recentNews = newsData.posts.slice(0, 4);
  const description =
    metrics.source === "database"
      ? `${metrics.currentSeasonLabel} operations across competitions, fixtures, squads, statistics, news, awards, and records.`
      : "Database is not connected yet. Connect Supabase to enable live admin data and writes.";
  const resources = [
    {
      title: "Competitions",
      href: "/admin/competitions",
      count: metrics.activeCompetitionCount,
      detail: "active competitions",
    },
    {
      title: "Fixtures",
      href: "/admin/fixtures",
      count: metrics.upcomingFixtureCount + metrics.liveMatchCount,
      detail: `${metrics.liveMatchCount} live`,
    },
    {
      title: "Teams",
      href: "/admin/teams",
      count: metrics.teamCount,
      detail: "Squad limit 25",
    },
    {
      title: "Players",
      href: "/admin/players",
      count: metrics.totalPlayers,
      detail: "Current season",
    },
    {
      title: "Statistics",
      href: "/admin/statistics",
      count: metrics.totalPlayers + metrics.teamCount,
      detail: "Auto-calculated",
    },
    {
      title: "News",
      href: "/admin/news",
      count: metrics.newsCount,
      detail: "All posts",
    },
    {
      title: "Venues",
      href: "/admin/venues",
      count: metrics.venueCount,
      detail: "Neutral matches",
    },
    {
      title: "Awards",
      href: "/admin/awards-records",
      count: metrics.awardCount,
      detail: "Season tracked",
    },
  ];

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow={`Current Season - ${metrics.currentSeasonLabel}`}
        title="Tournament control room"
        description={description}
        action={
          <Link
            href="/admin/fixtures"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-bold text-white transition hover:bg-red-600"
          >
            <FiPlus aria-hidden="true" />
            Match update
          </Link>
        }
      />

      {query.error === "forbidden" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Your admin role cannot access that developer-only control.
        </div>
      ) : null}

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
                <div key={match.id} className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">
                        {match.competitionName}
                      </p>
                      <p className="mt-1 text-base font-bold text-slate-950">
                        {match.homeTeamShort} {match.homeScore ?? 0} -{" "}
                        {match.awayScore ?? 0} {match.awayTeamShort}
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
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {match.matchday} at {match.venueName}
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
            {nextFixtures.length ? (
              nextFixtures.map((match) => (
                <div key={match.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-950">
                      {match.homeTeamShort} vs {match.awayTeamShort}
                    </p>
                    <p className="text-xs font-bold text-red-500">
                      {formatMatchTime(match.kickoffAt)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {formatDate(match.kickoffAt)} - {match.competitionName}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-3 text-sm font-semibold text-slate-500">
                No upcoming fixtures yet.
              </p>
            )}
          </div>
        </AdminPanel>
      </section>

      <AdminPanel title="Recent News">
        {recentNews.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {recentNews.map((post) => (
              <Link
                key={post.id}
                href={`/admin/news?post=${post.slug}`}
                className="rounded-lg border border-slate-200 p-4 transition hover:border-red-500"
              >
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-blue-600">
                  {post.competitionName}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-950">{post.title}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {formatDate(post.publishDate)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-500">
            No news posts published yet.
          </p>
        )}
      </AdminPanel>
    </div>
  );
}

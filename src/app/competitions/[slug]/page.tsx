import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import KnockoutBracket from "@/app/components/KnockoutBracket";
import LeagueTable from "@/app/components/LeagueTable";
import MatchCard from "@/app/components/MatchCard";
import NewsCard from "@/app/components/NewsCard";
import SectionHeader from "@/app/components/SectionHeader";
import LiveFixturesSync from "@/app/fixtures/LiveFixturesSync";
import { type Team } from "@/lib/league-data";
import { getPublicCompetitionDetail } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CompetitionDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicCompetitionDetail(slug);

  if (!data) {
    notFound();
  }

  const {
    competition,
    tableRows,
    teams,
    matches,
    news,
    knockoutMatches,
    hasKnockout,
  } = data;
  const hasLive = matches.some((m) => m.status === "live");
  const isPendingSuperCup =
    competition.type === "Super Cup" && competition.status === "upcoming";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <LiveFixturesSync hasLiveMatches={hasLive} />
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-red-500 via-red-600 to-slate-950 p-6 text-white shadow-lg md:p-8">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold uppercase tracking-[0.08em] text-red-100 backdrop-blur">
            {competition.type}
          </span>
          <span className="rounded-full bg-red-500/30 px-3 py-0.5 text-xs font-bold uppercase tracking-[0.08em] text-white">
            {isPendingSuperCup ? "pending" : competition.status}
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
          {competition.name}
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-red-100/90">
          {competition.description}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <HeroStat label="Teams" value={competition.plannedTeams.toString()} />
          <HeroStat label="Pots" value={competition.potCount.toString()} />
          <HeroStat
            label="Opp/pot"
            value={competition.opponentsPerPot.toString()}
          />
          <HeroStat
            label="Qualifiers"
            value={`Top ${competition.qualifiers}`}
          />
          <HeroStat
            label="Knockout"
            value={competition.knockoutStart.replace(/_/g, " ")}
          />
        </div>
      </div>

      {/* Standings Table */}
      <section className="space-y-3">
        <SectionHeader
          eyebrow="Standings"
          title="League Phase Table"
          actionHref={`/tables?competition=${competition.id}`}
          actionLabel="Full table"
        />
        {isPendingSuperCup ? (
          <PendingSuperCupPanel />
        ) : (
          <LeagueTable teams={tableRows} compact />
        )}
      </section>

      {/* Knockout Bracket */}
      {hasKnockout && (
        <section className="space-y-3">
          <SectionHeader eyebrow="Knockouts" title="Tournament Bracket" />
          <KnockoutBracket matches={knockoutMatches} />
        </section>
      )}

      {/* Fixtures & Teams Grid */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <SectionHeader
            eyebrow="Schedule"
            title="Fixtures & Results"
            actionHref={`/fixtures?competition=${competition.id}`}
            actionLabel="All matches"
          />
          <div className="grid gap-3">
            {matches.slice(0, 4).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
            {matches.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
                {isPendingSuperCup
                  ? "Super Cup fixtures will appear once the competition becomes active."
                  : "No fixtures scheduled yet."}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader
            eyebrow="Enrolled"
            title="Teams & Pots"
            actionHref={`/teams?competition=${competition.id}`}
            actionLabel="Team directory"
          />
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-2">
              {teams.map((team: Team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.slug}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-red-50 hover:text-red-500"
                >
                  <span className="truncate">{team.name}</span>
                  <span className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-500">
                    Pot {team.pot}
                  </span>
                </Link>
              ))}
              {teams.length === 0 && (
                <p className="py-4 text-center text-xs font-semibold text-slate-400">
                  {isPendingSuperCup
                    ? "Qualified teams will appear once the Super Cup becomes active."
                    : "No teams registered yet."}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* News section */}
      {news.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            title="Competition News"
            actionHref="/news"
            actionLabel="All news"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {news.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <div>
        <Link
          href="/competitions"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-red-500 hover:text-red-500"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to competitions
        </Link>
      </div>
    </section>
  );
}

function PendingSuperCupPanel() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-sm font-bold text-slate-950">
        Super Cup standings are pending.
      </p>
      <p className="mx-auto mt-2 max-w-2xl text-xs font-semibold leading-5 text-slate-500">
        Local competitions are shown now. The Super Cup table, qualified teams,
        fixtures, and bracket will publish once its status changes to active.
      </p>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-3.5 backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-red-200">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-white">{value}</p>
    </div>
  );
}

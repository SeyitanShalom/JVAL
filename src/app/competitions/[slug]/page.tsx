import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import LeagueTable from "@/app/components/LeagueTable";
import MatchCard from "@/app/components/MatchCard";
import NewsCard from "@/app/components/NewsCard";
import SectionHeader from "@/app/components/SectionHeader";
import { competitions, type Team } from "@/lib/league-data";
import { getPublicCompetitionDetail } from "@/lib/public-data";

export function generateStaticParams() {
  return competitions.map((competition) => ({ slug: competition.slug }));
}

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

  const { competition, tableRows, teams, matches, news } = data;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 p-6 text-white shadow-lg md:p-8">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-100 backdrop-blur">
            {competition.type}
          </span>
          <span className="rounded-full bg-blue-500/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
            {competition.status}
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{competition.name}</h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-blue-100/90">
          {competition.description}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HeroStat label="Teams" value={competition.plannedTeams.toString()} />
          <HeroStat label="Pots" value={competition.potCount.toString()} />
          <HeroStat label="Qualifiers" value={`Top ${competition.qualifiers}`} />
          <HeroStat label="Knockout" value={competition.knockoutStart.replace(/_/g, " ")} />
        </div>
      </div>

      {/* Standings Table */}
      <section className="space-y-3">
        <SectionHeader
          eyebrow="Standings"
          title="League Table"
          actionHref={`/tables?competition=${competition.id}`}
          actionLabel="Full table"
        />
        <LeagueTable teams={tableRows} compact />
      </section>

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
                No fixtures scheduled yet.
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
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <span className="truncate">{team.name}</span>
                  <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                    Pot {team.pot}
                  </span>
                </Link>
              ))}
              {teams.length === 0 && (
                <p className="py-4 text-center text-xs font-semibold text-slate-400">
                  No teams registered yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* News section */}
      {news.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Competition News" actionHref="/news" actionLabel="All news" />
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
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-600"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to competitions
        </Link>
      </div>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-3.5 backdrop-blur">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200">{label}</p>
      <p className="mt-1 text-base font-bold text-white">{value}</p>
    </div>
  );
}

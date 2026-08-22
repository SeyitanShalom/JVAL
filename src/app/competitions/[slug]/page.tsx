import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";
import LeagueTable from "@/app/components/LeagueTable";
import MatchCard from "@/app/components/MatchCard";
import NewsCard from "@/app/components/NewsCard";
import SectionHeader from "@/app/components/SectionHeader";
import {
  competitions,
  getCompetitionBySlug,
  getMatchesForCompetition,
  getTableRows,
  getTeamsForCompetition,
  newsPosts,
} from "@/lib/league-data";

export function generateStaticParams() {
  return competitions.map((competition) => ({ slug: competition.slug }));
}

export default async function CompetitionDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const competition = getCompetitionBySlug(slug);

  if (!competition) {
    notFound();
  }

  const tableRows = getTableRows(competition.id);
  const competitionTeams = getTeamsForCompetition(competition.id);
  const competitionMatches = getMatchesForCompetition(competition.id);
  const competitionNews = newsPosts.filter((post) => post.competitionId === competition.id);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="rounded-lg bg-blue-600 p-6 text-white md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">
          {competition.type} | {competition.status}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-normal sm:text-5xl">{competition.name}</h1>
        <p className="mt-4 max-w-3xl text-sm font-semibold leading-5 text-white/90">{competition.description}</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-4">
          <HeroStat label="Teams" value={competition.plannedTeams.toString()} />
          <HeroStat label="Pots" value={competition.potCount.toString()} />
          <HeroStat label="Qualifiers" value={competition.qualifiers.toString()} />
          <HeroStat label="Knockout" value={competition.knockoutStart} />
        </div>
      </div>

      <section className="space-y-3">
        <SectionHeader title="Current Table" actionHref={`/tables?competition=${competition.id}`} actionLabel="Full table" />
        <LeagueTable teams={tableRows} compact/>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-3">
          <SectionHeader title="Fixtures & Results" actionHref={`/fixtures?competition=${competition.id}`} actionLabel="All matches" />
          <div className="grid gap-3">
            {competitionMatches.slice(0, 3).map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader title="Teams" actionHref={`/teams?competition=${competition.id}`} actionLabel="Team list" />
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-2">
              {competitionTeams.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.slug}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-950"
                >
                  <span>{team.name}</span>
                  <span className="text-xs text-slate-500">Pot {team.pot}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {competitionNews.length ? (
        <section className="space-y-3">
          <SectionHeader title="Competition News" actionHref="/news" actionLabel="All news" />
          <div className="grid gap-3 md:grid-cols-2">
            {competitionNews.map((post) => (
              <NewsCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      <Link href="/competitions" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">
        <FiArrowRight className="rotate-180" aria-hidden="true" />
        Back to competitions
      </Link>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/10 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-100">{label}</p>
      <p className="mt- text-lg font-bold text-white">{value}</p>
    </div>
  );
}

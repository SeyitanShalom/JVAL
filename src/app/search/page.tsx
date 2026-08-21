import Image from "next/image";
import Link from "next/link";
import SectionHeader from "../components/SectionHeader";
import {
  formatDate,
  getTeamById,
  matches,
  newsPosts,
  players,
  teams,
} from "@/lib/league-data";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = await searchParams;
  const q = (query.q ?? "").trim().toLowerCase();

  const teamResults = q ? teams.filter((team) => team.name.toLowerCase().includes(q) || team.community.toLowerCase().includes(q)) : teams.slice(0, 4);
  const playerResults = q ? players.filter((player) => player.name.toLowerCase().includes(q)) : players.slice(0, 4);
  const newsResults = q ? newsPosts.filter((post) => post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)) : newsPosts.slice(0, 3);
  const matchResults = q
    ? matches.filter((match) => {
        const home = getTeamById(match.homeTeamId)?.name.toLowerCase() ?? "";
        const away = getTeamById(match.awayTeamId)?.name.toLowerCase() ?? "";
        return home.includes(q) || away.includes(q) || match.matchday.toLowerCase().includes(q);
      })
    : matches.slice(0, 4);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader eyebrow="Find" title="Search" description="Search teams, players, matches, and news." />

      <form className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <input
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Search Johnvents Apex League"
          className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none transition focus:border-blue-600"
        />
        <button className="h-11 rounded-lg bg-blue-700 px-4 text-sm font-black text-white" type="submit">
          Search
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <ResultSection title="Teams">
          {teamResults.map((team) => (
            <Link key={team.id} href={`/teams/${team.slug}`} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
              <Image src={team.logo} alt={`${team.name} logo`} width={38} height={38} className="h-9 w-9 object-contain" />
              <div>
                <p className="font-black text-slate-950">{team.name}</p>
                <p className="text-xs font-semibold text-slate-500">{team.community}</p>
              </div>
            </Link>
          ))}
        </ResultSection>

        <ResultSection title="Players">
          {playerResults.map((player) => (
            <Link key={player.id} href={`/players/${player.slug}`} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
              <Image src={player.photo} alt={`${player.name} photo`} width={38} height={38} className="h-9 w-9 rounded-lg object-cover" />
              <div>
                <p className="font-black text-slate-950">{player.name}</p>
                <p className="text-xs font-semibold text-slate-500">#{player.number} | {player.detailedPosition}</p>
              </div>
            </Link>
          ))}
        </ResultSection>

        <ResultSection title="Matches">
          {matchResults.map((match) => {
            const home = getTeamById(match.homeTeamId);
            const away = getTeamById(match.awayTeamId);

            return (
              <Link key={match.id} href={`/matches/${match.slug}`} className="rounded-lg bg-white p-3 shadow-sm">
                <p className="font-black text-slate-950">{home?.name} vs {away?.name}</p>
                <p className="text-xs font-semibold text-slate-500">{match.matchday} | {match.status}</p>
              </Link>
            );
          })}
        </ResultSection>

        <ResultSection title="News">
          {newsResults.map((post) => (
            <Link key={post.id} href={`/news/${post.slug}`} className="rounded-lg bg-white p-3 shadow-sm">
              <p className="font-black text-slate-950">{post.title}</p>
              <p className="text-xs font-semibold text-slate-500">{formatDate(post.publishDate)}</p>
            </Link>
          ))}
        </ResultSection>
      </div>
    </section>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <SectionHeader title={title} />
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

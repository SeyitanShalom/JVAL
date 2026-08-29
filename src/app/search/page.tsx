import Image from "next/image";
import Link from "next/link";
import { FiSearch } from "react-icons/fi";
import SectionHeader from "../components/SectionHeader";
import { formatDate, getTeamById } from "@/lib/league-data";
import { getPublicSearchData } from "@/lib/public-data";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = await searchParams;
  const data = await getPublicSearchData(query.q);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Directory Search"
        title="Global Search"
        description="Quickly find teams, players, fixtures, and tournament news across all competitions."
      />

      <form className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            name="q"
            defaultValue={data.q}
            placeholder="Search teams, players, fixtures, or news..."
            className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </div>
        <button
          className="h-11 rounded-xl bg-red-500 px-6 text-xs font-bold text-white shadow-sm transition hover:bg-red-600"
          type="submit"
        >
          Search
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Teams */}
        <ResultSection title="Clubs & Teams">
          {data.teamResults.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.slug}`}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-blue-300"
            >
              <Image
                src={team.logo}
                alt={`${team.name} logo`}
                width={38}
                height={38}
                className="h-9 w-9 object-contain"
              />
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-950 text-sm">
                  {team.name}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {team.community}
                </p>
              </div>
            </Link>
          ))}
          {data.teamResults.length === 0 && (
            <p className="text-xs font-semibold text-slate-400 py-2">
              No matching teams.
            </p>
          )}
        </ResultSection>

        {/* Players */}
        <ResultSection title="Players">
          {data.playerResults.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.slug}`}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-blue-300"
            >
              <Image
                src={player.photo}
                alt={`${player.name} photo`}
                width={38}
                height={38}
                className="h-9 w-9 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-950 text-sm">
                  {player.name}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  #{player.number} · {player.detailedPosition}
                </p>
              </div>
            </Link>
          ))}
          {data.playerResults.length === 0 && (
            <p className="text-xs font-semibold text-slate-400 py-2">
              No matching players.
            </p>
          )}
        </ResultSection>

        {/* Matches */}
        <ResultSection title="Fixtures & Results">
          {data.matchResults.map((match) => {
            const home = getTeamById(match.homeTeamId);
            const away = getTeamById(match.awayTeamId);

            return (
              <Link
                key={match.id}
                href={`/matches/${match.slug}`}
                className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition hover:border-blue-300"
              >
                <p className="font-bold text-slate-950 text-sm">
                  {home?.name} vs {away?.name}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  {match.matchday} ·{" "}
                  <span className="capitalize font-bold text-blue-600">
                    {match.status}
                  </span>
                </p>
              </Link>
            );
          })}
          {data.matchResults.length === 0 && (
            <p className="text-xs font-semibold text-slate-400 py-2">
              No matching matches.
            </p>
          )}
        </ResultSection>

        {/* News */}
        <ResultSection title="News Articles">
          {data.newsResults.map((post) => (
            <Link
              key={post.id}
              href={`/news/${post.slug}`}
              className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition hover:border-blue-300"
            >
              <p className="font-bold text-slate-950 text-sm line-clamp-1">
                {post.title}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {formatDate(post.publishDate)}
              </p>
            </Link>
          ))}
          {data.newsResults.length === 0 && (
            <p className="text-xs font-semibold text-slate-400 py-2">
              No matching news articles.
            </p>
          )}
        </ResultSection>
      </div>
    </section>
  );
}

function ResultSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <SectionHeader title={title} />
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

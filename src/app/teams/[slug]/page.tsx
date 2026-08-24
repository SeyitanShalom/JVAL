import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import MatchCard from "@/app/components/MatchCard";
import SectionHeader from "@/app/components/SectionHeader";
import { teams } from "@/lib/league-data";
import { getPublicTeamDetail } from "@/lib/public-data";

export function generateStaticParams() {
  return teams.map((team) => ({ slug: team.slug }));
}

export default async function TeamDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicTeamDetail(slug);

  if (!data) {
    notFound();
  }

  const { team, squad, matches } = data;
  const goalDifference = team.goalsFor - team.goalsAgainst;

  // Group squad by position group
  const positionGroups = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Header Card */}
      <div className="overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200 md:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-50 p-3 border border-slate-100 shadow-inner">
            <Image
              src={team.logo}
              alt={`${team.name} logo`}
              width={70}
              height={70}
              className="h-16 w-16 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase text-blue-700">
                Pot {team.pot}
              </span>
              <span className="text-xs font-bold text-slate-400">·</span>
              <span className="text-xs font-bold text-slate-500">{team.community}</span>
            </div>
            <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">{team.name}</h1>
            <p className="mt-2 text-xs font-bold text-slate-500">
              Head Coach: <span className="text-slate-800">{team.coach}</span> · Captain:{" "}
              <span className="text-slate-800">{team.captain}</span> · Squad:{" "}
              <span className="text-slate-800">{squad.length}/25 players</span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Played" value={team.played.toString()} />
          <Stat label="Points" value={team.points.toString()} highlight />
          <Stat label="Goals Scored" value={team.goalsFor.toString()} />
          <Stat
            label="Goal Difference"
            value={goalDifference > 0 ? `+${goalDifference}` : goalDifference.toString()}
          />
        </div>
      </div>

      {/* Squad & Matches */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Squad Breakdown */}
        <div className="space-y-4">
          <SectionHeader
            eyebrow="Roster"
            title="Team Squad"
            actionHref="/players"
            actionLabel="All players"
          />

          <div className="space-y-4">
            {positionGroups.map((group) => {
              const groupPlayers = squad.filter((p) => p.positionGroup === group);
              if (!groupPlayers.length) return null;

              return (
                <div key={group} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    {group}s ({groupPlayers.length})
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {groupPlayers.map((player) => (
                      <Link
                        key={player.id}
                        href={`/players/${player.slug}`}
                        className="flex items-center gap-3 rounded-lg bg-slate-50 p-2.5 transition hover:bg-blue-50"
                      >
                        <Image
                          src={player.photo}
                          alt={`${player.name} photo`}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-950">
                            #{player.number} {player.name}
                          </p>
                          <p className="text-[11px] font-bold text-slate-400">
                            {player.detailedPosition}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixtures & Results */}
        <div className="space-y-4">
          <SectionHeader
            eyebrow="Schedule"
            title="Fixtures & Results"
            actionHref={`/fixtures?team=${team.id}`}
            actionLabel="Team matches"
          />
          <div className="grid gap-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} compact />
            ))}
            {matches.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs font-semibold text-slate-400">
                No matches scheduled for this team yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <div>
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-600"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to all teams
        </Link>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3.5 ${
        highlight ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-950"
      }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
          highlight ? "text-blue-100" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

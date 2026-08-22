import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MatchCard from "@/app/components/MatchCard";
import SectionHeader from "@/app/components/SectionHeader";
import {
  getMatchesForTeam,
  getPlayersForTeam,
  getTeamBySlug,
  teams,
} from "@/lib/league-data";

export function generateStaticParams() {
  return teams.map((team) => ({ slug: team.slug }));
}

export default async function TeamDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const team = getTeamBySlug(slug);

  if (!team) {
    notFound();
  }

  const squad = getPlayersForTeam(team.id);
  const teamMatches = getMatchesForTeam(team.id);
  const goalDifference = team.goalsFor - team.goalsAgainst;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="rounded-lg bg-white p-5 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-50">
            <Image src={team.logo} alt={`${team.name} logo`} width={60} height={60} className="h-16 w-16 object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Pot {team.pot} | {team.community}</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950 sm:text-5xl">{team.name}</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
              Coach: {team.coach} | Captain: {team.captain}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-4">
          <Stat label="Played" value={team.played.toString()} />
          <Stat label="Points" value={team.points.toString()} />
          <Stat label="Goals For" value={team.goalsFor.toString()} />
          <Stat label="Goal Diff." value={goalDifference > 0 ? `+${goalDifference}` : goalDifference.toString()} />
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-3">
          <SectionHeader title="Squad" actionHref="/players" actionLabel="All players" />
          <div className="grid gap-3 sm:grid-cols-2">
            {squad.length ? (
              squad.map((player) => (
                <Link
                  key={player.id}
                  href={`/players/${player.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <Image src={player.photo} alt={`${player.name} photo`} width={44} height={44} className="h-11 w-11 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">#{player.number} - {player.name}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {player.positionGroup} | {player.detailedPosition}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500 sm:col-span-2">
                Squad placeholder will fill from the admin dashboard.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader title="Matches" actionHref={`/fixtures?team=${team.id}`} actionLabel="Team fixtures" />
          <div className="grid gap-3">
            {teamMatches.map((match) => (
              <MatchCard key={match.id} match={match} compact />
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

import Image from "next/image";
import { notFound } from "next/navigation";
import MatchCard from "@/app/components/MatchCard";
import SectionHeader from "@/app/components/SectionHeader";
import {
  calculateAge,
  getMatchesForTeam,
  getPlayerBySlug,
  getTeamById,
  players,
} from "@/lib/league-data";

export function generateStaticParams() {
  return players.map((player) => ({ slug: player.slug }));
}

export default async function PlayerDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const player = getPlayerBySlug(slug);

  if (!player) {
    notFound();
  }

  const team = getTeamById(player.teamId);
  const teamMatches = getMatchesForTeam(player.teamId).slice(0, 3);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="grid gap-6 rounded-lg bg-white p-5 shadow-sm md:grid-cols-[auto_1fr] md:p-8">
        <Image src={player.photo} alt={`${player.name} photo`} width={180} height={180} className="h-44 w-44 rounded-lg object-cover" />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
            #{player.number} | {player.positionGroup} | {player.detailedPosition}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-5xl">{player.name}</h1>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            {team?.name} | Age {calculateAge(player.dateOfBirth)}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Apps" value={player.appearances.toString()} />
            <Stat label="Goals" value={player.goals.toString()} />
            <Stat label="Assists" value={player.assists.toString()} />
            <Stat label="Clean Sheets" value={player.cleanSheets.toString()} />
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
        <div className="space-y-3">
          <SectionHeader title="Discipline" />
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Yellow Cards" value={player.yellowCards.toString()} />
            <Stat label="Red Cards" value={player.redCards.toString()} />
          </div>
        </div>
        <div className="space-y-3">
          <SectionHeader title="Team Matches" />
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

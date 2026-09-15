import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import MatchCard from "@/app/components/MatchCard";
import SectionHeader from "@/app/components/SectionHeader";
import { calculateAge } from "@/lib/league-data";
import { getPublicPlayerDetail } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlayerDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicPlayerDetail(slug);

  if (!data) {
    notFound();
  }

  const { player, team, matches } = data;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Player Header Banner */}
      <div className="grid gap-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-[auto_1fr] md:p-8">
        <Image
          src={player.photo}
          alt={`${player.name} photo`}
          width={180}
          height={180}
          className="h-36 w-36 rounded-lg object-cover shadow-sm sm:h-44 sm:w-44"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-red-500">
            #{player.number} <span aria-hidden="true">&middot;</span>{" "}
            {player.positionGroup} <span aria-hidden="true">&middot;</span>{" "}
            {player.detailedPosition}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-slate-950 sm:text-4xl">{player.name}</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
            Club: <span className="text-slate-900">{team?.name}</span>
            <span className="mx-1 text-slate-300" aria-hidden="true">
              &middot;
            </span>
            Age{" "}
            <span className="text-slate-900">{calculateAge(player.dateOfBirth)}</span>
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Appearances" value={player.appearances.toString()} />
            <Stat label="Goals" value={player.goals.toString()} highlight={player.goals > 0} />
            <Stat label="Assists" value={player.assists.toString()} />
            <Stat label="Clean Sheets" value={player.cleanSheets.toString()} />
          </div>
        </div>
      </div>

      {/* Discipline & Team Matches */}
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          <SectionHeader eyebrow="Fair Play" title="Disciplinary Record" />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
                Yellow Cards
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-900 tabular-nums sm:text-3xl">
                {player.yellowCards}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-red-700">
                Red Cards
              </p>
              <p className="mt-1 text-2xl font-bold text-red-900 tabular-nums sm:text-3xl">
                {player.redCards}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader
            eyebrow="Club Fixtures"
            title="Recent Team Matches"
            actionHref={`/fixtures?team=${player.teamId}`}
            actionLabel="All team matches"
          />
          <div className="grid gap-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} compact />
            ))}
          </div>
        </div>
      </section>

      <div>
        <Link
          href="/players"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-red-500 hover:text-red-500"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to all players
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
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          highlight ? "text-red-600" : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FiArrowLeft,
  FiAward,
  FiCalendar,
  FiFlag,
  FiShield,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import MatchCard from "@/app/components/MatchCard";
import SectionHeader from "@/app/components/SectionHeader";
import { getPublicTeamDetail } from "@/lib/public-data";
import { formatDate, type Competition, type Match, type Player } from "@/lib/league-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const positionGroups: Array<{
  key: Player["positionGroup"];
  label: string;
}> = [
  { key: "Goalkeeper", label: "Goalkeepers" },
  { key: "Defender", label: "Defenders" },
  { key: "Midfielder", label: "Midfielders" },
  { key: "Forward", label: "Forwards" },
];

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

  const { team, squad, matches, competitions, season, squadLimit } = data;
  const goalDifference = team.goalsFor - team.goalsAgainst;
  const goalDifferenceLabel =
    goalDifference > 0 ? `+${goalDifference}` : goalDifference.toString();
  const recordLabel = `${team.wins}W ${team.draws}D ${team.losses}L`;
  const nextMatch = getNextMatch(matches);
  const latestResult = getLatestResult(matches);
  const topScorer = getTopPlayer(squad, "goals");
  const groupedSquad = positionGroups
    .map((group) => ({
      ...group,
      players: squad.filter((player) => player.positionGroup === group.key),
    }))
    .filter((group) => group.players.length > 0);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link
        href="/teams"
        className="motion-link inline-flex w-fit items-center gap-2 text-xs font-bold text-red-500"
      >
        <FiArrowLeft aria-hidden="true" />
        Teams
      </Link>

      <div className="motion-panel overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="relative overflow-hidden bg-slate-950 px-4 py-6 text-white sm:px-6 md:px-8 md:py-8">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,39,39,0.28),transparent_36%,rgba(255,255,255,0.08)_36%,transparent_46%)]" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white p-3 shadow-xl shadow-black/20 sm:h-28 sm:w-28">
                <Image
                  src={team.logo}
                  alt={`${team.name} logo`}
                  width={80}
                  height={80}
                  priority
                  className="motion-image h-16 w-16 object-contain sm:h-20 sm:w-20"
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                    Pot {team.pot}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-red-100">
                    {season.label}
                  </span>
                </div>
                <h1 className="mt-3 text-3xl font-black leading-tight tracking-normal sm:text-5xl">
                  {team.name}
                </h1>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                  {team.community || "Community TBC"} / Coach {team.coach} /
                  Captain {team.captain}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4 md:w-[25rem] md:grid-cols-2">
              <HeroMetric label="Points" value={team.points.toString()} />
              <HeroMetric label="Record" value={recordLabel} />
              <HeroMetric label="Goals" value={`${team.goalsFor}:${team.goalsAgainst}`} />
              <HeroMetric label="GD" value={goalDifferenceLabel} />
            </div>
          </div>
        </div>

        <div className="grid gap-0 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <InfoStrip
            icon={FiUsers}
            label="Squad"
            value={`${squad.length}/${squadLimit} players`}
          />
          <InfoStrip
            icon={FiShield}
            label="Competitions"
            value={`${competitions.length} active listing${competitions.length === 1 ? "" : "s"}`}
          />
          <InfoStrip
            icon={FiCalendar}
            label="Next match"
            value={nextMatch ? formatDate(nextMatch.date) : "TBC"}
          />
          <InfoStrip
            icon={FiTarget}
            label="Top scorer"
            value={topScorer ? `${topScorer.name} (${topScorer.goals})` : "No goals yet"}
          />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="motion-panel rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <SectionHeader title="Competition Profile" />
          <div className="motion-stagger mt-4 flex flex-wrap gap-2">
            {competitions.map((competition) => (
              <CompetitionChip key={competition.id} competition={competition} />
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniMetric label="Played" value={team.played.toString()} />
            <MiniMetric label="Wins" value={team.wins.toString()} />
            <MiniMetric label="Form" value={team.form.length ? team.form.join("") : "-"} />
          </div>
        </div>

        <div className="motion-panel rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <SectionHeader title="Recent Form" />
          <FormStrip form={team.form} />
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Latest result
            </p>
            <p className="mt-1 text-sm font-bold text-slate-950">
              {latestResult
                ? `${latestResult.homeTeamShort ?? "HOM"} ${latestResult.homeScore ?? 0} - ${latestResult.awayScore ?? 0} ${latestResult.awayTeamShort ?? "AWY"}`
                : "No result recorded yet"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <SectionHeader
            eyebrow="Roster"
            title="Team Squad"
            actionHref="/players"
            actionLabel="All players"
          />

          {groupedSquad.length ? (
            <div className="space-y-4">
              {groupedSquad.map((group) => (
                <section
                  key={group.key}
                  className="motion-panel rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                      {group.label}
                    </h2>
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                      {group.players.length}
                    </span>
                  </div>
                  <div className="motion-stagger grid gap-2 sm:grid-cols-2">
                    {group.players.map((player) => (
                      <PlayerRow key={player.id} player={player} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="motion-panel rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
              No players have been registered for this team yet.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SectionHeader
            eyebrow="Schedule"
            title="Fixtures & Results"
            actionHref={`/fixtures?team=${team.id}`}
            actionLabel="Team matches"
          />
          <div className="motion-stagger grid gap-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} compact />
            ))}
            {matches.length === 0 && (
              <div className="motion-panel rounded-lg border border-slate-200 bg-white p-6 text-center text-xs font-semibold text-slate-400">
                No matches scheduled for this team yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <Link
        href="/teams"
        className="motion-button inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-red-500 hover:text-red-500"
      >
        <FiArrowLeft aria-hidden="true" />
        Back to all teams
      </Link>
    </section>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-red-100">
        {label}
      </p>
      <p className="mt-1 truncate text-lg font-black tabular-nums text-white">
        {value}
      </p>
    </div>
  );
}

function InfoStrip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FiUsers;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-red-50 text-red-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-bold text-slate-950">
          {value}
        </p>
      </div>
    </div>
  );
}

function CompetitionChip({ competition }: { competition: Competition }) {
  return (
    <Link
      href={`/competitions/${competition.slug}`}
      className="motion-card inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500"
    >
      <FiFlag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{competition.name}</span>
      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] uppercase text-slate-400">
        {competition.status}
      </span>
    </Link>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-950">{value}</p>
    </div>
  );
}

function FormStrip({ form }: { form: Array<"W" | "D" | "L"> }) {
  if (!form.length) {
    return (
      <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs font-semibold text-slate-500">
        Form will appear after the first completed fixture.
      </p>
    );
  }

  return (
    <div className="motion-stagger mt-4 flex gap-2">
      {form.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-black text-white ${
            result === "W"
              ? "bg-emerald-600"
              : result === "D"
                ? "bg-slate-500"
                : "bg-red-600"
          }`}
        >
          {result}
        </span>
      ))}
    </div>
  );
}

function PlayerRow({ player }: { player: Player }) {
  return (
    <Link
      href={`/players/${player.slug}`}
      className="motion-card group grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-slate-50 p-2.5 transition hover:bg-red-50"
    >
      <Image
        src={player.photo}
        alt={`${player.name} photo`}
        width={44}
        height={44}
        className="motion-image h-11 w-11 rounded-lg object-cover"
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-950 transition group-hover:text-red-500">
          #{player.number} {player.name}
        </p>
        <p className="truncate text-[11px] font-bold text-slate-400">
          {player.detailedPosition}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1 text-center">
        <PlayerStat icon={FiAward} value={player.goals} label="G" />
        <PlayerStat icon={FiTrendingUp} value={player.assists} label="A" />
      </div>
    </Link>
  );
}

function PlayerStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof FiAward;
  value: number;
  label: string;
}) {
  return (
    <span className="grid min-w-8 place-items-center rounded-md bg-white px-1.5 py-1">
      <Icon className="h-3 w-3 text-red-500" aria-hidden="true" />
      <span className="mt-0.5 text-[10px] font-black text-slate-950">
        {value}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function getNextMatch(matches: Match[]) {
  return matches.find((match) => match.status === "live") ??
    matches.find((match) => match.status === "upcoming") ??
    null;
}

function getLatestResult(matches: Match[]) {
  return (
    [...matches]
      .filter((match) => match.status === "finished")
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      )[0] ?? null
  );
}

function getTopPlayer(players: Player[], metric: "goals" | "assists") {
  return (
    [...players]
      .filter((player) => player[metric] > 0)
      .sort((a, b) => b[metric] - a[metric] || a.name.localeCompare(b.name))[0] ??
    null
  );
}

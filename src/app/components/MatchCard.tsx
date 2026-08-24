import Image from "next/image";
import Link from "next/link";
import {
  formatDate,
  formatMatchTime,
  getCompetitionById,
  getTeamById,
  getVenueById,
  type Match,
} from "@/lib/league-data";

type MatchCardProps = {
  match: Match;
  compact?: boolean;
};

const statusClasses: Record<Match["status"], string> = {
  live: "bg-green-50 text-green-700",
  upcoming: "bg-blue-50 text-blue-600",
  finished: "bg-slate-100 text-slate-700",
  postponed: "bg-amber-50 text-amber-700",
};

export default function MatchCard({ match, compact = false }: MatchCardProps) {
  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  const competition = getCompetitionById(match.competitionId);
  const venue = getVenueById(match.venueId);

  if (!homeTeam || !awayTeam || !competition || !venue) {
    return null;
  }

  const score =
    typeof match.homeScore === "number" && typeof match.awayScore === "number"
      ? `${match.homeScore} - ${match.awayScore}`
      : formatMatchTime(match.date);

  return (
    <Link
      href={`/matches/${match.slug}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-500 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            <span>{competition.name}</span>
            <span>{match.matchday}</span>
          </div>
          {!compact ? (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {formatDate(match.date)} at {venue.name}
            </p>
          ) : null}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusClasses[match.status]}`}
        >
          {match.status === "live" ? match.minute : ""}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamBlock logo={homeTeam.logo} name={homeTeam.name} align="left" />
        <div className="rounded-lg px-3 py-2 text-center text-sm font-bold text-blue-600">
          {score}
          {match.penalties ? (
            <p className="mt-0.5 text-[10px] font-bold text-blue-500">
              {match.penalties.home}-{match.penalties.away} pens
            </p>
          ) : null}
        </div>
        <TeamBlock logo={awayTeam.logo} name={awayTeam.name} align="right" />
      </div>
    </Link>
  );
}

function TeamBlock({
  logo,
  name,
  align,
}: {
  logo: string;
  name: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${align === "right" ? "justify-end text-right" : ""}`}
    >
      {align === "left" ? (
        <Image
          src={logo}
          width={30}
          height={30}
          alt={`${name} logo`}
          className="h-7 w-7 object-contain"
        />
      ) : null}
      <p className="truncate text-sm font-semibold text-slate-950">{name}</p>
      {align === "right" ? (
        <Image
          src={logo}
          width={30}
          height={30}
          alt={`${name} logo`}
          className="h-7 w-7 object-contain"
        />
      ) : null}
    </div>
  );
}

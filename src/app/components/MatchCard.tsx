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
import LiveMatchClock from "./LiveMatchClock";

type MatchCardProps = {
  match: Match;
  compact?: boolean;
};

export default function MatchCard({ match, compact = false }: MatchCardProps) {
  const fallbackHomeTeam = getTeamById(match.homeTeamId);
  const fallbackAwayTeam = getTeamById(match.awayTeamId);
  const fallbackCompetition = getCompetitionById(match.competitionId);
  const fallbackVenue = getVenueById(match.venueId);

  if (
    !fallbackHomeTeam ||
    !fallbackAwayTeam ||
    !fallbackCompetition ||
    !fallbackVenue
  ) {
    return null;
  }

  const homeTeam = {
    logo: match.homeTeamLogo ?? fallbackHomeTeam.logo,
    name: match.homeTeamName ?? fallbackHomeTeam.name,
  };
  const awayTeam = {
    logo: match.awayTeamLogo ?? fallbackAwayTeam.logo,
    name: match.awayTeamName ?? fallbackAwayTeam.name,
  };
  const competitionName = match.competitionName ?? fallbackCompetition.name;
  const venueName = match.venueName ?? fallbackVenue.name;
  const homeScore =
    match.homeScore ??
    (match.status === "live" || match.status === "finished" ? 0 : null);
  const awayScore =
    match.awayScore ??
    (match.status === "live" || match.status === "finished" ? 0 : null);
  const score =
    typeof homeScore === "number" && typeof awayScore === "number"
      ? `${homeScore} - ${awayScore}`
      : formatMatchTime(match.date);

  return (
    <Link
      href={`/matches/${match.slug}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-500 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            <span>{competitionName}</span>
            <span>{match.matchday}</span>
          </div>
          {!compact ? (
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {formatDate(match.date)} at {venueName}
            </p>
          ) : null}
        </div>
        <LiveMatchClock
          status={match.status}
          minute={match.minute}
          currentPeriod={match.currentPeriod}
          firstHalfStartedAt={match.firstHalfStartedAt}
          secondHalfStartedAt={match.secondHalfStartedAt}
          variant="badge"
        />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamBlock logo={homeTeam.logo} name={homeTeam.name} align="left" />
        <div className="rounded-lg px-3 py-2 text-center text-sm font-bold text-red-500">
          {score}
          {match.penalties ? (
            <p className="mt-0.5 text-[10px] font-bold text-red-500">
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
  const logoImage = (
    <Image
      src={logo}
      width={30}
      height={30}
      alt={`${name} logo`}
      className="h-7 w-7 shrink-0 object-contain"
    />
  );

  if (align === "right") {
    return (
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-right">
        <p className="min-w-0 truncate text-sm font-semibold text-slate-950">
          {name}
        </p>
        {logoImage}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
      {logoImage}
      <p className="min-w-0 truncate text-sm font-semibold text-slate-950">
        {name}
      </p>
    </div>
  );
}

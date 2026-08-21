import Image from "next/image";
import { notFound } from "next/navigation";
import SectionHeader from "@/app/components/SectionHeader";
import {
  formatDate,
  formatMatchTime,
  getCompetitionById,
  getMatchBySlug,
  getPlayerById,
  getPlayersForTeam,
  getTeamById,
  getVenueById,
  matches,
} from "@/lib/league-data";

export function generateStaticParams() {
  return matches.map((match) => ({ slug: match.slug }));
}

export default async function MatchDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const match = getMatchBySlug(slug);

  if (!match) {
    notFound();
  }

  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  const competition = getCompetitionById(match.competitionId);
  const venue = getVenueById(match.venueId);

  if (!homeTeam || !awayTeam || !competition || !venue) {
    notFound();
  }

  const homePlayers = getPlayersForTeam(homeTeam.id);
  const awayPlayers = getPlayersForTeam(awayTeam.id);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="rounded-lg bg-slate-950 p-5 text-white md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">
          {competition.name} | {match.matchday} | {match.status}
        </p>
        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamHeader name={homeTeam.name} logo={homeTeam.logo} />
          <div className="rounded-lg bg-white px-4 py-3 text-center text-2xl font-black text-slate-950">
            {typeof match.homeScore === "number" ? `${match.homeScore} - ${match.awayScore}` : formatMatchTime(match.date)}
            {match.penalties ? (
              <p className="mt-1 text-xs font-black text-slate-500">
                {match.penalties.home}-{match.penalties.away} pens
              </p>
            ) : null}
          </div>
          <TeamHeader name={awayTeam.name} logo={awayTeam.logo} align="right" />
        </div>
        <div className="mt-6 grid gap-2 text-sm font-semibold text-white/80 sm:grid-cols-4">
          <p>{formatDate(match.date)}</p>
          <p>{venue.name}</p>
          <p>{venue.location}</p>
          <p>{match.referee ?? "Referee TBC"}</p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-3">
          <SectionHeader title="Live Timeline" />
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="space-y-3">
              {match.events.length ? (
                match.events.map((event) => {
                  const team = getTeamById(event.teamId);
                  const player = getPlayerById(event.playerId);
                  const assist = event.assistPlayerId ? getPlayerById(event.assistPlayerId) : undefined;

                  return (
                    <div key={event.id} className="grid grid-cols-[48px_1fr] gap-3 rounded-lg bg-slate-50 p-3">
                      <p className="text-sm font-black text-blue-700">{event.minute}</p>
                      <div>
                        <p className="text-sm font-black text-slate-950">{event.type}</p>
                        <p className="text-xs font-semibold text-slate-600">
                          {player?.name} | {team?.name}
                          {assist ? ` | Assist: ${assist.name}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm font-semibold text-slate-500">Timeline will update when match events are entered.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader title="Lineups" />
          <div className="grid gap-3">
            <LineupBlock title={homeTeam.name} formation={match.formationHome ?? "TBC"} players={homePlayers} />
            <LineupBlock title={awayTeam.name} formation={match.formationAway ?? "TBC"} players={awayPlayers} />
          </div>
        </div>
      </section>

      {match.penalties ? (
        <section className="space-y-3">
          <SectionHeader title="Penalty Shootout" />
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              {match.penalties.attempts.map((attempt) => {
                const team = getTeamById(attempt.teamId);
                const player = getPlayerById(attempt.playerId);

                return (
                  <div key={`${attempt.teamId}-${attempt.order}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                    <span className="font-bold text-slate-700">
                      {attempt.order}. {player?.name} | {team?.shortName}
                    </span>
                    <span className={`font-black ${attempt.scored ? "text-green-700" : "text-red-700"}`}>
                      {attempt.scored ? "Scored" : "Missed"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </section>
  );
}

function TeamHeader({ name, logo, align = "left" }: { name: string; logo: string; align?: "left" | "right" }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${align === "right" ? "justify-end text-right" : ""}`}>
      {align === "left" ? <Image src={logo} alt={`${name} logo`} width={54} height={54} className="h-12 w-12 object-contain" /> : null}
      <h1 className="truncate text-lg font-black sm:text-2xl">{name}</h1>
      {align === "right" ? <Image src={logo} alt={`${name} logo`} width={54} height={54} className="h-12 w-12 object-contain" /> : null}
    </div>
  );
}

function LineupBlock({
  title,
  formation,
  players,
}: {
  title: string;
  formation: string;
  players: Array<{ id: string; number: number; name: string; detailedPosition: string }>;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-950">{title}</p>
        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">{formation}</span>
      </div>
      <div className="mt-3 space-y-2">
        {players.length ? (
          players.slice(0, 11).map((player) => (
            <p key={player.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              #{player.number} {player.name} | {player.detailedPosition}
            </p>
          ))
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">Lineup pending</p>
        )}
      </div>
    </div>
  );
}

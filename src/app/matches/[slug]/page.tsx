import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiClock, FiMapPin, FiUser } from "react-icons/fi";
import SectionHeader from "@/app/components/SectionHeader";
import { formatDate, formatMatchTime, matches } from "@/lib/league-data";
import { getPublicMatchDetail } from "@/lib/public-data";

export function generateStaticParams() {
  return matches.map((match) => ({ slug: match.slug }));
}

export default async function MatchDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicMatchDetail(slug);

  if (!data) {
    notFound();
  }

  const { match, homeTeam, awayTeam, competition, venue, homePlayers, awayPlayers } = data;

  const isFinished = match.status === "finished";
  const isLive = match.status === "live";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Match Header Hero Card */}
      <div className="overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
          <span>
            {competition.name} · {match.matchday}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
              isLive
                ? "bg-red-500 text-white animate-pulse"
                : isFinished
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {isLive ? `${match.minute ?? "Live"}` : match.status}
          </span>
        </div>

        <div className="my-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamHeader name={homeTeam.name} logo={homeTeam.logo} align="left" />

          <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 px-6 py-4 backdrop-blur">
            <span className="text-3xl font-bold text-white sm:text-5xl tabular-nums tracking-wider">
              {typeof match.homeScore === "number" && typeof match.awayScore === "number"
                ? `${match.homeScore} - ${match.awayScore}`
                : formatMatchTime(match.date)}
            </span>
            {match.penalties && (
              <span className="mt-1.5 rounded-full bg-blue-500/30 px-3 py-0.5 text-xs font-bold text-blue-200">
                ({match.penalties.home} - {match.penalties.away} pens)
              </span>
            )}
          </div>

          <TeamHeader name={awayTeam.name} logo={awayTeam.logo} align="right" />
        </div>

        <div className="grid gap-3 border-t border-white/10 pt-4 text-xs font-semibold text-slate-300 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <FiClock className="text-blue-400" />
            <span>{formatDate(match.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiMapPin className="text-blue-400" />
            <span>{venue.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span>{venue.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiUser className="text-blue-400" />
            <span>{match.referee ? `Referee: ${match.referee}` : "Referee TBC"}</span>
          </div>
        </div>
      </div>

      {/* Timeline & Lineups */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Match Events Timeline */}
        <div className="space-y-3">
          <SectionHeader eyebrow="Match Events" title="Live Timeline" />
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-3">
              {match.events.length ? (
                match.events.map((event) => (
                  <div
                    key={event.id}
                    className="grid grid-cols-[50px_1fr] items-center gap-3 rounded-lg bg-slate-50 p-3 transition hover:bg-blue-50"
                  >
                    <span className="text-center text-sm font-bold text-blue-700">
                      {event.minute}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-950">{event.type}</p>
                      <p className="text-xs font-semibold text-slate-600">
                        {event.playerId ?? "Player"} · {event.teamId === homeTeam.id ? homeTeam.name : awayTeam.name}
                        {event.assistPlayerId ? ` (Assist: ${event.assistPlayerId})` : ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-semibold text-slate-400">
                  Timeline events will update as the match progresses.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team Lineups */}
        <div className="space-y-3">
          <SectionHeader eyebrow="Squad Selections" title="Team Lineups" />
          <div className="grid gap-4">
            <LineupBlock
              teamName={homeTeam.name}
              formation={match.formationHome ?? "4-3-3"}
              players={homePlayers}
            />
            <LineupBlock
              teamName={awayTeam.name}
              formation={match.formationAway ?? "4-3-3"}
              players={awayPlayers}
            />
          </div>
        </div>
      </section>

      {/* Penalties if any */}
      {match.penalties && match.penalties.attempts.length > 0 && (
        <section className="space-y-3">
          <SectionHeader eyebrow="Shootout" title="Penalty Shootout Breakdown" />
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              {match.penalties.attempts.map((attempt, idx) => (
                <div
                  key={`${attempt.teamId}-${attempt.order}-${idx}`}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-xs"
                >
                  <span className="font-bold text-slate-800">
                    Round {attempt.order}: {attempt.teamId === homeTeam.id ? homeTeam.shortName : awayTeam.shortName}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 font-bold uppercase text-[11px] ${
                      attempt.scored
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {attempt.scored ? "Scored" : "Missed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div>
        <Link
          href="/fixtures"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-600"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to all fixtures
        </Link>
      </div>
    </section>
  );
}

function TeamHeader({
  name,
  logo,
  align = "left",
}: {
  name: string;
  logo: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 ${
        align === "right" ? "justify-end text-right" : "justify-start text-left"
      }`}
    >
      {align === "left" && (
        <Image
          src={logo}
          alt={`${name} logo`}
          width={54}
          height={54}
          className="h-12 w-12 shrink-0 object-contain drop-shadow"
        />
      )}
      <h2 className="truncate text-base font-bold sm:text-2xl">{name}</h2>
      {align === "right" && (
        <Image
          src={logo}
          alt={`${name} logo`}
          width={54}
          height={54}
          className="h-12 w-12 shrink-0 object-contain drop-shadow"
        />
      )}
    </div>
  );
}

function LineupBlock({
  teamName,
  formation,
  players,
}: {
  teamName: string;
  formation: string;
  players: Array<{ id: string; number: number; name: string; detailedPosition: string }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <p className="font-bold text-slate-950">{teamName}</p>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
          {formation}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        {players.length > 0 ? (
          players.slice(0, 11).map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              <span>
                <strong className="mr-1.5 text-slate-950">#{player.number}</strong>
                {player.name}
              </span>
              <span className="text-slate-400 font-bold">{player.detailedPosition}</span>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-xs font-semibold text-slate-400">
            Starting lineup pending announcement.
          </p>
        )}
      </div>
    </div>
  );
}

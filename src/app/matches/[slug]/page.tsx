import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiClock, FiMapPin, FiUser, FiZap, FiShield } from "react-icons/fi";
import SectionHeader from "@/app/components/SectionHeader";
import LiveMatchClock from "@/app/components/LiveMatchClock";
import LiveMatchSync from "./LiveMatchSync";
import { formatDate, formatMatchTime, matches, type EventType } from "@/lib/league-data";
import { getPublicMatchDetail } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return matches.map((match) => ({ slug: match.slug }));
}

const EVENT_EMOJI: Record<EventType, string> = {
  Goal: "âš½",
  Assist: "ðŸ…°ï¸",
  "Yellow card": "ðŸŸ¨",
  "Red card": "ðŸŸ¥",
  Substitution: "ðŸ”„",
  "Penalty scored": "âš½",
  "Penalty missed": "âŒ",
  "Own goal": "ðŸ”µ",
};

const EVENT_BG: Record<EventType, string> = {
  Goal: "bg-emerald-50 border-emerald-200",
  Assist: "bg-blue-50 border-blue-200",
  "Yellow card": "bg-amber-50 border-amber-200",
  "Red card": "bg-red-50 border-red-200",
  Substitution: "bg-slate-50 border-slate-200",
  "Penalty scored": "bg-emerald-50 border-emerald-200",
  "Penalty missed": "bg-red-50 border-red-200",
  "Own goal": "bg-purple-50 border-purple-200",
};

export default async function MatchDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicMatchDetail(slug);
  if (!data) notFound();

  const { match, homeTeam, awayTeam, competition, venue, homePlayers, awayPlayers, enrichedEvents, enrichedAttempts } = data;

  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const hasScore = typeof match.homeScore === "number" && typeof match.awayScore === "number";

  const homeGoals = enrichedEvents.filter((e) => (e.type === "Goal" || e.type === "Penalty scored") && e.teamId === homeTeam.id);
  const awayGoals = enrichedEvents.filter((e) => (e.type === "Goal" || e.type === "Penalty scored") && e.teamId === awayTeam.id);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">

      {/* Hero Score Card */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-200">
          <span>{competition.name} Â· {match.matchday} Â· <span className="capitalize">{match.stage.replace(/-/g, " ")}</span></span>
          <div className="flex items-center gap-2.5">
            <LiveMatchSync
              slug={slug}
              status={match.status}
              initialScore={hasScore ? `${match.homeScore}:${match.awayScore}` : "-:-"}
              initialEventCount={enrichedEvents.length}
            />
            <LiveMatchClock status={match.status} minute={match.minute} variant="hero" />
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-8 md:px-10">
          <TeamCol name={homeTeam.name} logo={homeTeam.logo} align="left" goalScorers={homeGoals.map((g) => g.playerName + " " + g.minute)} />
          <div className="flex flex-col items-center gap-2">
            <span className="tabular-nums text-4xl font-bold tracking-widest text-white sm:text-6xl">
              {hasScore ? match.homeScore + " â€“ " + match.awayScore : formatMatchTime(match.date)}
            </span>
            {match.penalties && (
              <span className="rounded-full bg-blue-500/30 px-3 py-0.5 text-xs font-bold text-blue-200">
                ({match.penalties.home} â€“ {match.penalties.away} pens)
              </span>
            )}
            {!hasScore && !isLive && <span className="text-xs font-semibold text-slate-400">{formatDate(match.date)}</span>}
          </div>
          <TeamCol name={awayTeam.name} logo={awayTeam.logo} align="right" goalScorers={awayGoals.map((g) => g.playerName + " " + g.minute)} />
        </div>

        <div className="grid gap-3 border-t border-white/10 px-6 py-4 text-xs font-semibold text-slate-400 sm:grid-cols-4">
          <MetaItem icon={<FiClock className="text-blue-400" />} text={formatDate(match.date)} />
          <MetaItem icon={<FiMapPin className="text-blue-400" />} text={venue.name} />
          <MetaItem icon={<span className="h-2 w-2 rounded-full bg-blue-400" />} text={venue.location} />
          <MetaItem icon={<FiUser className="text-blue-400" />} text={match.referee ? "Ref: " + match.referee : "Referee TBC"} />
        </div>
      </div>

      {/* Stats Bar */}
      {hasScore && (
        <MatchStatsBar homeTeam={homeTeam.shortName} awayTeam={awayTeam.shortName} events={enrichedEvents} homeId={homeTeam.id} awayId={awayTeam.id} />
      )}

      {/* Timeline & Lineups */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <SectionHeader eyebrow="Match Events" title="Live Timeline" />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {enrichedEvents.length > 0 ? (
              <ol className="relative space-y-1 border-l-2 border-slate-100 pl-5">
                {enrichedEvents.map((event) => {
                  const isHome = event.teamId === homeTeam.id;
                  const isSub = event.type === "Substitution";

                  return (
                    <li key={event.id} className="relative">
                      <span className={"absolute -left-[23px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[10px] shadow " + (event.type === "Goal" || event.type === "Penalty scored" ? "bg-emerald-500" : event.type === "Red card" ? "bg-red-500" : event.type === "Yellow card" ? "bg-amber-400" : "bg-slate-300")} />
                      <div className={"flex items-start gap-3 rounded-lg border p-3 " + EVENT_BG[event.type]}>
                        <span className="w-8 shrink-0 text-center text-xs font-bold text-slate-600">{event.minute}</span>
                        <span className="text-base leading-none">{EVENT_EMOJI[event.type]}</span>
                        <div className="min-w-0 flex-1">
                          {isSub ? (
                            <div>
                              <p className="text-sm font-bold text-slate-950">
                                <span className="text-emerald-700">â–² IN:</span> {event.playerInName || event.playerName}
                              </p>
                              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                <span className="text-red-600">â–¼ OUT:</span> {event.playerOutName || "Substituted Player"} Â· {isHome ? homeTeam.shortName : awayTeam.shortName}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="truncate text-sm font-bold text-slate-950">
                                {event.playerName}
                                {event.playerNumber !== null && <span className="ml-1 text-[11px] font-semibold text-slate-400">#{event.playerNumber}</span>}
                              </p>
                              <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                                {event.type} Â· {isHome ? homeTeam.shortName : awayTeam.shortName}
                                {event.assistPlayerName && <span className="ml-1 text-slate-400">(Assist: {event.assistPlayerName})</span>}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <FiZap className="h-8 w-8 text-slate-200" />
                <p className="text-sm font-bold text-slate-400">{isLive ? "Waiting for first event..." : "Timeline events will appear here."}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader eyebrow="Squad Selections" title="Team Lineups" />
          <div className="grid gap-4">
            <LineupBlock teamName={homeTeam.name} teamLogo={homeTeam.logo} formation={match.formationHome} players={homePlayers} />
            <LineupBlock teamName={awayTeam.name} teamLogo={awayTeam.logo} formation={match.formationAway} players={awayPlayers} />
          </div>
        </div>
      </section>

      {/* Penalty Shootout */}
      {enrichedAttempts.length > 0 && (
        <section className="space-y-3">
          <SectionHeader eyebrow="Shootout" title="Penalty Shootout" />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-3 items-center gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4">
              <p className="font-bold text-slate-950">{homeTeam.name}</p>
              <p className="text-center text-2xl font-bold text-blue-700 tabular-nums">{match.penalties?.home} â€“ {match.penalties?.away}</p>
              <p className="text-right font-bold text-slate-950">{awayTeam.name}</p>
            </div>
            <div className="divide-y divide-slate-100">
              {(() => {
                const maxOrder = Math.max(...enrichedAttempts.map((a) => a.order), 0);
                const rows = [];
                for (let ord = 1; ord <= maxOrder; ord++) {
                  const ha = enrichedAttempts.find((a) => a.order === ord && a.teamId === homeTeam.id);
                  const aa = enrichedAttempts.find((a) => a.order === ord && a.teamId === awayTeam.id);
                  rows.push(
                    <div key={ord} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-3">
                      <PenAttempt attempt={ha} align="left" />
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">R{ord}</span>
                      <PenAttempt attempt={aa} align="right" />
                    </div>
                  );
                }
                return rows;
              })()}
            </div>
          </div>
        </section>
      )}

      {/* Footer Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
        <Link
          href="/fixtures"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-700"
        >
          <FiArrowLeft /> Back to Match Center
        </Link>
        <Link
          href={"/matches/" + match.slug + "/team-sheet"}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800"
        >
          <FiShield /> View Printable Team Sheet
        </Link>
      </div>
    </section>
  );
}

function MetaItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-2">{icon}<span>{text}</span></div>;
}

function TeamCol({ name, logo, align, goalScorers }: { name: string; logo: string; align: "left" | "right"; goalScorers: string[] }) {
  return (
    <div className={"flex flex-col gap-2 " + (align === "right" ? "items-end text-right" : "items-start")}>
      <Image src={logo} alt={name + " logo"} width={56} height={56} className="h-14 w-14 object-contain" />
      <h2 className="text-lg font-bold text-white sm:text-2xl">{name}</h2>
      {goalScorers.length > 0 && (
        <ul className="space-y-0.5 text-xs text-blue-200">
          {goalScorers.map((g, i) => <li key={i}>âš½ {g}</li>)}
        </ul>
      )}
    </div>
  );
}

function PenAttempt({ attempt, align }: { attempt?: { playerName: string; scored: boolean; playerNumber?: number | null }; align: "left" | "right" }) {
  if (!attempt) return <div className={align === "right" ? "text-right" : ""}>â€”</div>;
  return (
    <div className={"flex items-center gap-2 " + (align === "right" ? "justify-end" : "")}>
      {align === "right" && <span className="text-xs font-bold text-slate-700">{attempt.playerName}</span>}
      <span className={"inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white " + (attempt.scored ? "bg-emerald-500" : "bg-red-500")}>
        {attempt.scored ? "âœ“" : "âœ—"}
      </span>
      {align === "left" && <span className="text-xs font-bold text-slate-700">{attempt.playerName}</span>}
    </div>
  );
}

function MatchStatsBar({ homeTeam, awayTeam, events, homeId, awayId }: { homeTeam: string; awayTeam: string; events: any[]; homeId: string; awayId: string }) {
  const homeGoals = events.filter((e) => (e.type === "Goal" || e.type === "Penalty scored") && e.teamId === homeId).length;
  const awayGoals = events.filter((e) => (e.type === "Goal" || e.type === "Penalty scored") && e.teamId === awayId).length;
  const homeYellow = events.filter((e) => e.type === "Yellow card" && e.teamId === homeId).length;
  const awayYellow = events.filter((e) => e.type === "Yellow card" && e.teamId === awayId).length;
  const homeRed = events.filter((e) => e.type === "Red card" && e.teamId === homeId).length;
  const awayRed = events.filter((e) => e.type === "Red card" && e.teamId === awayId).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Match Statistics</p>
      <div className="space-y-4">
        <StatRow label="Goals" homeVal={homeGoals} awayVal={awayGoals} />
        <StatRow label="Yellow Cards" homeVal={homeYellow} awayVal={awayYellow} />
        <StatRow label="Red Cards" homeVal={homeRed} awayVal={awayRed} />
      </div>
    </div>
  );
}

function StatRow({ label, homeVal, awayVal }: { label: string; homeVal: number; awayVal: number }) {
  const total = homeVal + awayVal || 1;
  const homePct = Math.round((homeVal / total) * 100);
  const awayPct = 100 - homePct;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-bold text-slate-700">
        <span>{homeVal}</span>
        <span className="font-semibold text-slate-400">{label}</span>
        <span>{awayVal}</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="bg-blue-600 transition-all duration-500" style={{ width: homePct + "%" }} />
        <div className="bg-amber-500 transition-all duration-500" style={{ width: awayPct + "%" }} />
      </div>
    </div>
  );
}

function LineupBlock({ teamName, teamLogo, formation, players }: { teamName: string; teamLogo: string; formation?: string; players: any[] }) {
  const starters = players.slice(0, 11);
  const subs = players.slice(11);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Image src={teamLogo} alt={teamName} width={24} height={24} className="h-6 w-6 object-contain" />
          <span className="text-sm font-bold text-slate-950">{teamName}</span>
        </div>
        {formation && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{formation}</span>}
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Starting XI ({starters.length})</p>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {starters.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50">
              <span className="w-5 text-center text-xs font-bold text-blue-700">{p.number}</span>
              <span className="truncate text-xs font-bold text-slate-800">{p.name}</span>
              <span className="ml-auto text-[10px] font-semibold text-slate-400">{p.detailedPosition}</span>
            </div>
          ))}
        </div>
      </div>

      {subs.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Substitutes ({subs.length})</p>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {subs.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50">
                <span className="w-5 text-center text-xs font-semibold text-slate-500">{p.number}</span>
                <span className="truncate text-xs text-slate-700">{p.name}</span>
                <span className="ml-auto text-[10px] text-slate-400">{p.detailedPosition}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
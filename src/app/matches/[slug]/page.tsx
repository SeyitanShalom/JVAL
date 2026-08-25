import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiClock, FiMapPin, FiUser, FiZap, FiShield } from "react-icons/fi";
import SectionHeader from "@/app/components/SectionHeader";
import { formatDate, formatMatchTime, matches, type EventType } from "@/lib/league-data";
import { getPublicMatchDetail } from "@/lib/public-data";

export function generateStaticParams() {
  return matches.map((match) => ({ slug: match.slug }));
}

const EVENT_EMOJI: Record<EventType, string> = {
  Goal: "⚽",
  Assist: "🅰️",
  "Yellow card": "🟨",
  "Red card": "🟥",
  Substitution: "🔄",
  "Penalty scored": "⚽",
  "Penalty missed": "❌",
  "Own goal": "🔵",
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-200">
          <span>{competition.name} · {match.matchday} · <span className="capitalize">{match.stage.replace(/-/g, " ")}</span></span>
          <StatusBadge isLive={isLive} isFinished={isFinished} minute={match.minute} />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-8 md:px-10">
          <TeamCol name={homeTeam.name} logo={homeTeam.logo} align="left" goalScorers={homeGoals.map((g) => g.playerName + " " + g.minute + "'")} />
          <div className="flex flex-col items-center gap-2">
            <span className="tabular-nums text-4xl font-bold tracking-widest text-white sm:text-6xl">
              {hasScore ? match.homeScore + " – " + match.awayScore : formatMatchTime(match.date)}
            </span>
            {match.penalties && (
              <span className="rounded-full bg-blue-500/30 px-3 py-0.5 text-xs font-bold text-blue-200">
                ({match.penalties.home} – {match.penalties.away} pens)
              </span>
            )}
            {!hasScore && !isLive && <span className="text-xs font-semibold text-slate-400">{formatDate(match.date)}</span>}
          </div>
          <TeamCol name={awayTeam.name} logo={awayTeam.logo} align="right" goalScorers={awayGoals.map((g) => g.playerName + " " + g.minute + "'")} />
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
                  return (
                    <li key={event.id} className="relative">
                      <span className={"absolute -left-[23px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[10px] shadow " + (event.type === "Goal" || event.type === "Penalty scored" ? "bg-emerald-500" : event.type === "Red card" ? "bg-red-500" : event.type === "Yellow card" ? "bg-amber-400" : "bg-slate-300")} />
                      <div className={"flex items-start gap-3 rounded-lg border p-3 " + EVENT_BG[event.type]}>
                        <span className="w-8 shrink-0 text-center text-xs font-bold text-slate-600">{event.minute}</span>
                        <span className="text-base leading-none">{EVENT_EMOJI[event.type]}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-950">
                            {event.playerName}
                            {event.playerNumber !== null && <span className="ml-1 text-[11px] font-semibold text-slate-400">#{event.playerNumber}</span>}
                          </p>
                          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                            {event.type} · {isHome ? homeTeam.shortName : awayTeam.shortName}
                            {event.assistPlayerName && <span className="ml-1 text-slate-400">(Assist: {event.assistPlayerName})</span>}
                          </p>
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
              <p className="text-center text-2xl font-bold text-blue-700 tabular-nums">{match.penalties?.home} – {match.penalties?.away}</p>
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
                      <span className="text-xs font-bold text-slate-300">#{ord}</span>
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

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/fixtures" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-600">
          <FiArrowLeft aria-hidden="true" />
          Back to all fixtures
        </Link>
        <Link href={`/matches/${match.slug}/team-sheet`} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-600 hover:text-blue-600">
          Team Sheet
        </Link>
      </div>
    </section>
  );
}

function StatusBadge({ isLive, isFinished, minute }: { isLive: boolean; isFinished: boolean; minute?: string }) {
  if (isLive) return (
    <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold uppercase text-white">
      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />{minute ?? "Live"}
    </span>
  );
  if (isFinished) return <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold uppercase text-emerald-300">Full Time</span>;
  return <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[11px] font-bold uppercase text-blue-300">Upcoming</span>;
}

function MetaItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-2">{icon}<span>{text}</span></div>;
}

function TeamCol({ name, logo, align, goalScorers }: { name: string; logo: string; align: "left" | "right"; goalScorers: string[] }) {
  return (
    <div className={"flex min-w-0 flex-col gap-2 " + (align === "right" ? "items-end text-right" : "items-start text-left")}>
      <div className={"flex items-center gap-3 " + (align === "right" ? "flex-row-reverse" : "")}>
        <Image src={logo} alt={name + " logo"} width={56} height={56} className="h-12 w-12 shrink-0 object-contain drop-shadow" />
        <h2 className="truncate text-base font-bold text-white sm:text-xl">{name}</h2>
      </div>
      {goalScorers.length > 0 && (
        <ul className="space-y-0.5 text-[11px] font-semibold text-emerald-300">
          {goalScorers.map((s, i) => <li key={i}>⚽ {s}</li>)}
        </ul>
      )}
    </div>
  );
}

function MatchStatsBar({ homeTeam, awayTeam, events, homeId, awayId }: { homeTeam: string; awayTeam: string; events: Array<{ type: string; teamId: string }>; homeId: string; awayId: string }) {
  const count = (type: string, tid: string) => events.filter((e) => e.type === type && e.teamId === tid).length;
  const stats = [
    { label: "Goals", homeVal: count("Goal", homeId), awayVal: count("Goal", awayId) },
    { label: "Yellow Cards", homeVal: count("Yellow card", homeId), awayVal: count("Yellow card", awayId) },
    { label: "Red Cards", homeVal: count("Red card", homeId), awayVal: count("Red card", awayId) },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <span>{homeTeam}</span>
        <span className="flex items-center gap-1"><FiShield className="text-blue-400" /> Match Stats</span>
        <span>{awayTeam}</span>
      </div>
      <div className="space-y-3">
        {stats.map(({ label, homeVal, awayVal }) => {
          const total = homeVal + awayVal || 1;
          const homePct = Math.round((homeVal / total) * 100);
          return (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{homeVal}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
                <span>{awayVal}</span>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="bg-blue-600 transition-all" style={{ width: homePct + "%" }} />
                <div className="bg-slate-300 transition-all" style={{ width: (100 - homePct) + "%" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineupBlock({ teamName, teamLogo, formation, players }: { teamName: string; teamLogo: string; formation?: string; players: Array<{ id: string; number: number; name: string; detailedPosition: string; positionGroup: string }> }) {
  const ORDER = ["Goalkeeper", "Defender", "Midfielder", "Forward"];
  const byGroup = Object.fromEntries(ORDER.map((g) => [g, players.filter((p) => p.positionGroup === g)]));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Image src={teamLogo} alt={teamName} width={22} height={22} className="h-5 w-5 object-contain" />
          <p className="font-bold text-slate-950">{teamName}</p>
        </div>
        {formation && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">{formation}</span>}
      </div>
      {players.length > 0 ? (
        <div className="divide-y divide-slate-50 px-4 pb-3">
          {ORDER.map((group) => (byGroup[group] ?? []).length > 0 ? (
            <div key={group} className="pt-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group}s</p>
              <div className="space-y-1">
                {(byGroup[group] ?? []).map((player) => (
                  <div key={player.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <span><strong className="mr-1.5 text-slate-950">#{player.number}</strong><span className="font-semibold text-slate-700">{player.name}</span></span>
                    <span className="font-bold text-slate-400">{player.detailedPosition}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null)}
        </div>
      ) : (
        <p className="py-6 text-center text-xs font-semibold text-slate-400">Starting lineup pending announcement.</p>
      )}
    </div>
  );
}

function PenAttempt({ attempt, align }: { attempt?: { playerName: string; scored: boolean }; align: "left" | "right" }) {
  if (!attempt) return <div className="h-8" />;
  return (
    <div className={"flex items-center gap-2 " + (align === "right" ? "flex-row-reverse" : "")}>
      <span className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold " + (attempt.scored ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600")}>
        {attempt.scored ? "✓" : "✕"}
      </span>
      <span className="truncate text-xs font-semibold text-slate-700">{attempt.playerName}</span>
    </div>
  );
}
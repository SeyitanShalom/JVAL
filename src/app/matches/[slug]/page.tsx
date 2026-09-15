import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FiArrowLeft,
  FiClock,
  FiMapPin,
  FiUser,
  FiZap,
  FiShield,
} from "react-icons/fi";
import SectionHeader from "@/app/components/SectionHeader";
import LiveMatchClock from "@/app/components/LiveMatchClock";
import LiveMatchSync from "./LiveMatchSync";
import {
  formatDate,
  formatMatchTime,
  type EventType,
  type Player,
} from "@/lib/league-data";
import {
  getPublicMatchDetail,
} from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EVENT_EMOJI: Record<EventType, string> = {
  Goal: "G",
  Assist: "A",
  "Yellow card": "YC",
  "Red card": "RC",
  Substitution: "SUB",
  "Penalty scored": "P",
  "Penalty missed": "PM",
  "Own goal": "OG",
  "Disallowed goal": "NO",
  Note: "N",
};

const EVENT_BG: Record<EventType, string> = {
  Goal: "bg-emerald-50 border-emerald-200",
  Assist: "bg-red-50 border-red-200",
  "Yellow card": "bg-amber-50 border-amber-200",
  "Red card": "bg-red-50 border-red-200",
  Substitution: "bg-slate-50 border-slate-200",
  "Penalty scored": "bg-emerald-50 border-emerald-200",
  "Penalty missed": "bg-red-50 border-red-200",
  "Own goal": "bg-purple-50 border-purple-200",
  "Disallowed goal": "bg-red-50 border-red-200",
  Note: "bg-slate-50 border-slate-200",
};

function isScoringEvent(type: EventType) {
  return type === "Goal" || type === "Penalty scored" || type === "Own goal";
}

function formatGoalScorer(event: {
  type: EventType;
  playerName?: string;
  minute: string;
}) {
  const prefix = event.type === "Own goal" ? "OG" : "G";
  return `${prefix} ${event.playerName || "Player"} ${event.minute}`;
}

export default async function MatchDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicMatchDetail(slug);
  if (!data) notFound();

  const {
    match,
    homeTeam,
    awayTeam,
    competition,
    venue,
    homePlayers,
    awayPlayers,
    enrichedEvents,
    enrichedAttempts,
  } = data;

  const isLive = match.status === "live";
  const hasScore =
    typeof match.homeScore === "number" && typeof match.awayScore === "number";
  const dateDetailText =
    isLive || match.status === "finished"
      ? `${formatDate(match.date)} at ${formatMatchTime(match.date)}`
      : formatDate(match.date);

  const homeGoals = enrichedEvents.filter(
    (e) => isScoringEvent(e.type) && e.teamId === homeTeam.id,
  );
  const awayGoals = enrichedEvents.filter(
    (e) => isScoringEvent(e.type) && e.teamId === awayTeam.id,
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* Hero Score Card */}
      <div className="overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 via-slate-950 to-red-950 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-red-200 sm:px-6">
          <span>
            {competition.name} - {match.matchday} -{" "}
            <span className="capitalize">{match.stage.replace(/-/g, " ")}</span>
          </span>
          <div className="flex items-center gap-2.5">
            <LiveMatchSync
              slug={slug}
              status={match.status}
              initialMinute={match.minute ?? null}
              initialTimerKey={[
                match.currentPeriod ?? "",
                match.firstHalfStartedAt ?? "",
                match.secondHalfStartedAt ?? "",
              ].join("|")}
              initialScore={
                hasScore ? `${match.homeScore}:${match.awayScore}` : "-:-"
              }
              initialEventCount={enrichedEvents.length}
            />
            <LiveMatchClock
              status={match.status}
              minute={match.minute}
              currentPeriod={match.currentPeriod}
              firstHalfStartedAt={match.firstHalfStartedAt}
              secondHalfStartedAt={match.secondHalfStartedAt}
              variant="hero"
            />
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 py-6 sm:gap-4 sm:px-6 sm:py-8 md:px-10">
          <TeamCol
            name={homeTeam.name}
            logo={homeTeam.logo}
            align="left"
            goalScorers={homeGoals.map(formatGoalScorer)}
          />
          <div className="flex flex-col items-center gap-2">
            <span className="max-w-[7rem] text-center text-2xl font-bold tracking-normal text-white tabular-nums sm:max-w-none sm:text-5xl sm:tracking-[0.08em] lg:text-6xl">
              {hasScore
                ? match.homeScore + " - " + match.awayScore
                : formatMatchTime(match.date)}
            </span>
            {match.penalties && (
              <span className="rounded-full bg-red-500/30 px-3 py-0.5 text-xs font-bold text-red-200">
                ({match.penalties.home} - {match.penalties.away} pens)
              </span>
            )}
            {!hasScore && !isLive && (
              <span className="text-xs font-semibold text-slate-400">
                {formatDate(match.date)}
              </span>
            )}
          </div>
          <TeamCol
            name={awayTeam.name}
            logo={awayTeam.logo}
            align="right"
            goalScorers={awayGoals.map(formatGoalScorer)}
          />
        </div>

        <div className="grid gap-3 border-t border-white/10 px-4 py-4 text-xs font-semibold text-slate-400 sm:grid-cols-4 sm:px-6">
          <MetaItem
            icon={<FiClock className="text-red-400" />}
            text={dateDetailText}
          />
          <MetaItem
            icon={<FiMapPin className="text-red-400" />}
            text={venue.name}
          />
          <MetaItem
            icon={<span className="h-2 w-2 rounded-full bg-red-400" />}
            text={venue.location}
          />
          <MetaItem
            icon={<FiUser className="text-red-400" />}
            text={match.referee ? "Ref: " + match.referee : "Referee TBC"}
          />
        </div>
      </div>

      {/* Stats Bar */}
      {hasScore && (
        <MatchStatsBar
          events={enrichedEvents}
          homeId={homeTeam.id}
          awayId={awayTeam.id}
        />
      )}

      {/* Timeline & Lineups */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <SectionHeader eyebrow="Match Events" title="Live Timeline" />
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
            {enrichedEvents.length > 0 ? (
              <ol className="grid gap-3">
                {enrichedEvents.map((event) => (
                  <TimelineEventRow
                    key={event.id}
                    event={event}
                    homeTeamId={homeTeam.id}
                    homeTeamShort={homeTeam.shortName}
                    awayTeamId={awayTeam.id}
                    awayTeamShort={awayTeam.shortName}
                  />
                ))}
              </ol>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <FiZap className="h-8 w-8 text-slate-200" />
                <p className="text-sm font-bold text-slate-400">
                  {isLive
                    ? "Waiting for first event..."
                    : "Timeline events will appear here."}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader eyebrow="Squad Selections" title="Team Lineups" />
          <div className="grid gap-4">
            <LineupBlock
              teamName={homeTeam.name}
              teamLogo={homeTeam.logo}
              formation={match.formationHome}
              players={homePlayers}
            />
            <LineupBlock
              teamName={awayTeam.name}
              teamLogo={awayTeam.logo}
              formation={match.formationAway}
              players={awayPlayers}
            />
          </div>
        </div>
      </section>

      {/* Penalty Shootout */}
      {enrichedAttempts.length > 0 && (
        <section className="space-y-3">
          <SectionHeader eyebrow="Shootout" title="Penalty Shootout" />
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-3 items-center gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4">
              <p className="font-bold text-slate-950">{homeTeam.name}</p>
              <p className="text-center text-2xl font-bold text-red-500 tabular-nums">
                {match.penalties?.home} - {match.penalties?.away}
              </p>
              <p className="text-right font-bold text-slate-950">
                {awayTeam.name}
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {(() => {
                const maxOrder = Math.max(
                  ...enrichedAttempts.map((a) => a.order),
                  0,
                );
                const rows = [];
                for (let ord = 1; ord <= maxOrder; ord++) {
                  const ha = enrichedAttempts.find(
                    (a) => a.order === ord && a.teamId === homeTeam.id,
                  );
                  const aa = enrichedAttempts.find(
                    (a) => a.order === ord && a.teamId === awayTeam.id,
                  );
                  rows.push(
                    <div
                      key={ord}
                      className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-3"
                    >
                      <PenAttempt attempt={ha} align="left" />
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                        R{ord}
                      </span>
                      <PenAttempt attempt={aa} align="right" />
                    </div>,
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
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-red-500 hover:text-red-500"
        >
          <FiArrowLeft /> Back to Match Center
        </Link>
        <Link
          href={"/matches/" + match.slug + "/team-sheet"}
          className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-600"
        >
          <FiShield /> View Printable Team Sheet
        </Link>
      </div>
    </section>
  );
}

function MetaItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function TimelineEventRow({
  event,
  homeTeamId,
  homeTeamShort,
  awayTeamId,
  awayTeamShort,
}: {
  event: {
    id: string;
    minute: string;
    type: EventType;
    teamId: string;
    teamSide?: "home" | "away" | null;
    actingTeamSide?: "home" | "away" | null;
    teamShortName?: string;
    actingTeamShortName?: string;
    playerName: string;
    playerNumber?: number | null;
    assistPlayerName?: string | null;
    playerInName?: string | null;
    playerOutName?: string | null;
    note?: string | null;
  };
  homeTeamId: string;
  homeTeamShort: string;
  awayTeamId: string;
  awayTeamShort: string;
}) {
  const eventSide =
    event.teamSide ??
    event.actingTeamSide ??
    (event.teamId === homeTeamId
      ? "home"
      : event.teamId === awayTeamId
        ? "away"
        : "home");
  const isHome = eventSide === "home";
  const teamShortName =
    event.teamShortName || (isHome ? homeTeamShort : awayTeamShort);
  const isSub = event.type === "Substitution";
  const ownGoalLabel =
    event.type === "Own goal" &&
    event.actingTeamShortName &&
    event.actingTeamShortName !== teamShortName
      ? `for ${teamShortName}`
      : teamShortName;
  const card = (
    <div
      className={
        "min-w-0 rounded-lg border p-2.5 text-left shadow-sm sm:p-3 " +
        EVENT_BG[event.type] +
        (isHome ? " sm:text-right" : "")
      }
    >
      <div
        className={
          "mb-1 flex items-center gap-2 " + (isHome ? "sm:justify-end" : "")
        }
      >
        <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
          {EVENT_EMOJI[event.type]}
        </span>
        <span className="text-[10px] font-bold uppercase text-slate-500">
          {teamShortName}
        </span>
      </div>

      {isSub ? (
        <div>
          <p className="break-words text-xs font-bold text-slate-950 sm:text-sm">
            <span className="text-emerald-700">IN:</span>{" "}
            {event.playerInName || event.playerName}
          </p>
          <p className="mt-0.5 break-words text-[11px] font-semibold text-slate-500">
            <span className="text-red-600">OUT:</span>{" "}
            {event.playerOutName || "Substituted Player"}
          </p>
        </div>
      ) : (
        <div>
          <p className="break-words text-xs font-bold text-slate-950 sm:text-sm">
            {event.playerName}
            {event.playerNumber != null && (
              <span className="ml-1 text-[11px] font-semibold text-slate-400">
                #{event.playerNumber}
              </span>
            )}
          </p>
          <p className="mt-0.5 break-words text-[11px] font-semibold text-slate-500">
            {event.type} - {ownGoalLabel}
            {event.assistPlayerName && (
              <span className="ml-1 text-slate-400">
                (Assist: {event.assistPlayerName})
              </span>
            )}
          </p>
          {event.note ? (
            <p className="mt-1 break-words text-[11px] font-semibold text-slate-500">
              {event.note}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)]">
      <div className="min-w-0">{isHome ? card : null}</div>

      <div className="relative flex flex-col items-center">
        <span className="absolute top-0 bottom-[-1rem] w-px bg-slate-200" />
        <span
          className={
            "relative z-10 flex h-7 min-w-10 items-center justify-center rounded-full border-2 border-white px-2 text-[10px] font-bold shadow tabular-nums " +
            getTimelineMarkerClass(event.type)
          }
        >
          {event.minute}
        </span>
      </div>

      <div className="min-w-0">{!isHome ? card : null}</div>
    </li>
  );
}

function getTimelineMarkerClass(type: EventType) {
  if (type === "Goal" || type === "Penalty scored") {
    return "bg-emerald-500 text-white";
  }
  if (type === "Disallowed goal" || type === "Red card") {
    return "bg-red-500 text-white";
  }
  if (type === "Yellow card") {
    return "bg-amber-400 text-slate-950";
  }
  return "bg-slate-200 text-slate-700";
}

function TeamCol({
  name,
  logo,
  align,
  goalScorers,
}: {
  name: string;
  logo: string;
  align: "left" | "right";
  goalScorers: string[];
}) {
  return (
    <div
      className={
        "flex min-w-0 flex-col gap-2 " +
        (align === "right" ? "items-end text-right" : "items-start")
      }
    >
      <Image
        src={logo}
        alt={name + " logo"}
        width={56}
        height={56}
        className="h-10 w-10 object-contain sm:h-14 sm:w-14"
      />
      <h2 className="max-w-full truncate text-xs font-bold text-white sm:text-xl lg:text-2xl">
        {name}
      </h2>
      {goalScorers.length > 0 && (
        <ul className="space-y-0.5 text-xs text-red-100">
          {goalScorers.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PenAttempt({
  attempt,
  align,
}: {
  attempt?: {
    playerName: string;
    scored: boolean;
    playerNumber?: number | null;
  };
  align: "left" | "right";
}) {
  if (!attempt)
    return <div className={align === "right" ? "text-right" : ""}>-</div>;
  return (
    <div
      className={
        "flex items-center gap-2 " + (align === "right" ? "justify-end" : "")
      }
    >
      {align === "right" && (
        <span className="text-xs font-bold text-slate-700">
          {attempt.playerName}
        </span>
      )}
      <span
        className={
          "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white " +
          (attempt.scored ? "bg-emerald-500" : "bg-red-500")
        }
      >
        {attempt.scored ? "S" : "M"}
      </span>
      {align === "left" && (
        <span className="text-xs font-bold text-slate-700">
          {attempt.playerName}
        </span>
      )}
    </div>
  );
}

function MatchStatsBar({
  events,
  homeId,
  awayId,
}: {
  events: Array<{ type: EventType; teamId: string }>;
  homeId: string;
  awayId: string;
}) {
  const homeGoals = events.filter(
    (e) => isScoringEvent(e.type) && e.teamId === homeId,
  ).length;
  const awayGoals = events.filter(
    (e) => isScoringEvent(e.type) && e.teamId === awayId,
  ).length;
  const homeYellow = events.filter(
    (e) => e.type === "Yellow card" && e.teamId === homeId,
  ).length;
  const awayYellow = events.filter(
    (e) => e.type === "Yellow card" && e.teamId === awayId,
  ).length;
  const homeRed = events.filter(
    (e) => e.type === "Red card" && e.teamId === homeId,
  ).length;
  const awayRed = events.filter(
    (e) => e.type === "Red card" && e.teamId === awayId,
  ).length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
        Match Statistics
      </p>
      <div className="space-y-4">
        <StatRow label="Goals" homeVal={homeGoals} awayVal={awayGoals} />
        <StatRow
          label="Yellow Cards"
          homeVal={homeYellow}
          awayVal={awayYellow}
        />
        <StatRow label="Red Cards" homeVal={homeRed} awayVal={awayRed} />
      </div>
    </div>
  );
}

function StatRow({
  label,
  homeVal,
  awayVal,
}: {
  label: string;
  homeVal: number;
  awayVal: number;
}) {
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
        <div
          className="bg-red-600 transition-all duration-500"
          style={{ width: homePct + "%" }}
        />
        <div
          className="bg-amber-500 transition-all duration-500"
          style={{ width: awayPct + "%" }}
        />
      </div>
    </div>
  );
}

function LineupBlock({
  teamName,
  teamLogo,
  formation,
  players,
}: {
  teamName: string;
  teamLogo: string;
  formation?: string;
  players: Player[];
}) {
  const starters = players.slice(0, 11);
  const subs = players.slice(11);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Image
            src={teamLogo}
            alt={teamName}
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
          <span className="text-sm font-bold text-slate-950">{teamName}</span>
        </div>
        {formation && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
            {formation}
          </span>
        )}
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
          Starting XI ({starters.length})
        </p>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {starters.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50"
            >
              <span className="w-5 text-center text-xs font-bold text-red-600">
                {p.number}
              </span>
              <span className="truncate text-xs font-bold text-slate-800">
                {p.name}
              </span>
              <span className="ml-auto text-[10px] font-semibold text-slate-400">
                {p.detailedPosition}
              </span>
            </div>
          ))}
        </div>
      </div>

      {subs.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Substitutes ({subs.length})
          </p>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {subs.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50"
              >
                <span className="w-5 text-center text-xs font-semibold text-slate-500">
                  {p.number}
                </span>
                <span className="truncate text-xs text-slate-700">
                  {p.name}
                </span>
                <span className="ml-auto text-[10px] text-slate-400">
                  {p.detailedPosition}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

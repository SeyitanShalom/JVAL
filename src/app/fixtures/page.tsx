import Image from "next/image";
import Link from "next/link";
import { FiCalendar, FiChevronRight, FiClock, FiMapPin } from "react-icons/fi";
import CompactFilterForm from "../components/CompactFilterForm";
import FilterSelect from "../components/FilterSelect";
import LiveMatchClock from "../components/LiveMatchClock";
import SectionHeader from "../components/SectionHeader";
import LiveFixturesSync from "./LiveFixturesSync";
import {
  getPublicCompetitionFilterLabel,
  getPublicFixturesData,
} from "@/lib/public-data";
import {
  defaultTeamLogo,
  formatMatchTime,
  type Match,
} from "@/lib/league-data";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
  { value: "finished", label: "Finished" },
  { value: "postponed", label: "Postponed" },
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{
    competition?: string;
    season?: string;
    status?: string;
    team?: string;
    matchday?: string;
  }>;
}) {
  const query = await searchParams;
  const data = await getPublicFixturesData(query);

  const selectedStatus = query.status ?? "all";
  const selectedCompetition = query.competition ?? "all";
  const selectedSeason = query.season ?? "all";
  const selectedTeam = query.team ?? "all";
  const selectedMatchday = query.matchday ?? "all";
  const selectedCompetitionRecord = data.competitionsList.find(
    (competition) =>
      competition.id === selectedCompetition ||
      competition.slug === selectedCompetition,
  );
  const isPendingSuperCupFilter =
    selectedCompetitionRecord?.type === "Super Cup" &&
    selectedCompetitionRecord.status === "upcoming";
  const groupedMatches = groupMatchesByDate(data.matches);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <LiveFixturesSync hasLiveMatches={data.hasLiveMatches} />
      <SectionHeader
        eyebrow="Match Center"
        title="Fixtures & Results"
        description="Neutral-venue fixtures, live match events, full-time scores, and penalty shootout records."
      />

      <CompactFilterForm
        resultLabel={`${data.matches.length} match${data.matches.length !== 1 ? "es" : ""}`}
      >
        <FilterSelect
          label="Season"
          name="season"
          value={selectedSeason}
          options={[
            { value: "all", label: "All seasons" },
            ...data.seasonsList.map((s) => ({ value: s.id, label: s.label })),
          ]}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...data.competitionsList.map((c) => ({
              value: c.id,
              label: getPublicCompetitionFilterLabel(c),
            })),
          ]}
        />
        <FilterSelect
          label="Status"
          name="status"
          value={selectedStatus}
          options={statusOptions}
        />
        <FilterSelect
          label="Team"
          name="team"
          value={selectedTeam}
          options={[
            { value: "all", label: "All teams" },
            ...data.teamsList.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />
        <FilterSelect
          label="Matchday"
          name="matchday"
          value={selectedMatchday}
          options={[
            { value: "all", label: "All rounds" },
            ...data.matchdays.map((m) => ({ value: m, label: m })),
          ]}
        />
      </CompactFilterForm>

      {/* <div className="grid gap-3 sm:grid-cols-3">
        <FixtureSummaryPill label="Live" value={summary.live} tone="live" />
        <FixtureSummaryPill
          label="Upcoming"
          value={summary.upcoming}
          tone="upcoming"
        />
        <FixtureSummaryPill
          label="Finished"
          value={summary.finished}
          tone="finished"
        />
      </div> */}

      {/* Export row */}
      <div className="flex items-center justify-between ">
        <p className="text-xs font-semibold text-slate-500">
          {data.matches.length} match{data.matches.length !== 1 ? "es" : ""}
        </p>
        {/* <ExportButton
          competition={selectedCompetition}
          status={selectedStatus}
          team={selectedTeam}
          matchday={selectedMatchday}
          season={query.season}
        /> */}
      </div>

      <div className="space-y-8">
        {data.matches.length ? (
          groupedMatches.map((group) => (
            <section
              key={group.key}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white">
                    <FiCalendar className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-slate-950">
                      {group.label}
                    </h2>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {group.matches.length} match
                      {group.matches.length !== 1 ? "es" : ""}
                    </p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {group.matches.map((match) => (
                  <FixtureRow key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-base font-bold text-slate-950">
              {isPendingSuperCupFilter ? "Super Cup pending" : "No matches found"}
            </p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {isPendingSuperCupFilter
                ? "Fixtures will appear here once the Super Cup status changes to active."
                : "Try adjusting your filter by selecting another competition, team, or status."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

const fixtureDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Africa/Lagos",
  year: "numeric",
});

const fixtureDateLabelFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "Africa/Lagos",
  weekday: "long",
  year: "numeric",
});

function groupMatchesByDate(matches: Match[]) {
  const groups = new Map<
    string,
    { key: string; label: string; matches: Match[] }
  >();

  for (const match of matches) {
    const date = new Date(match.date);
    const key = fixtureDateKeyFormatter.format(date);
    const label = fixtureDateLabelFormatter.format(date);
    const group = groups.get(key) ?? { key, label, matches: [] };
    group.matches.push(match);
    groups.set(key, group);
  }

  return Array.from(groups.values());
}

function FixtureRow({ match }: { match: Match }) {
  const home = {
    name: match.homeTeamName ?? match.homeTeamShort ?? "Home Team",
    shortName: match.homeTeamShort ?? "HOM",
    logo: match.homeTeamLogo ?? defaultTeamLogo,
  };
  const away = {
    name: match.awayTeamName ?? match.awayTeamShort ?? "Away Team",
    shortName: match.awayTeamShort ?? "AWY",
    logo: match.awayTeamLogo ?? defaultTeamLogo,
  };
  const competitionName = match.competitionName ?? "Competition";
  const venueName = match.venueName ?? match.venueLocation ?? "Venue TBC";
  const homeScore =
    match.homeScore ??
    (match.status === "live" || match.status === "finished" ? 0 : null);
  const awayScore =
    match.awayScore ??
    (match.status === "live" || match.status === "finished" ? 0 : null);
  const hasScore =
    typeof homeScore === "number" && typeof awayScore === "number";
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isPostponed = match.status === "postponed";
  const centerText = hasScore
    ? `${homeScore} - ${awayScore}`
    : isPostponed
      ? "PPD"
      : "vs";
  const centerTone = isLive
    ? "bg-red-600 text-white shadow-sm"
    : isFinished
      ? "bg-slate-950 text-white shadow-sm"
      : isPostponed
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-500";
  const homeOutcome =
    isFinished && hasScore
      ? homeScore > awayScore
        ? "winner"
        : homeScore < awayScore
          ? "muted"
          : "normal"
      : "normal";
  const awayOutcome =
    isFinished && hasScore
      ? awayScore > homeScore
        ? "winner"
        : awayScore < homeScore
          ? "muted"
          : "normal"
      : "normal";

  return (
    <Link
      href={`/matches/${match.slug}`}
      className="group grid gap-3 px-4 py-3 transition hover:bg-red-50/70 lg:grid-cols-[5.75rem_minmax(0,1fr)_5.75rem_minmax(0,1fr)_minmax(10rem,12rem)_1.75rem] lg:items-center"
    >
      <div className="flex items-center justify-between gap-3 lg:block">
        <time className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 tabular-nums">
          <FiClock className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
          {formatMatchTime(match.date)}
        </time>
        <LiveMatchClock
          status={match.status}
          minute={match.minute}
          currentPeriod={match.currentPeriod}
          firstHalfStartedAt={match.firstHalfStartedAt}
          secondHalfStartedAt={match.secondHalfStartedAt}
          variant="badge"
          className="lg:mt-1"
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_5.75rem_minmax(0,1fr)] items-center gap-3 lg:contents">
        <TeamCell team={home} align="left" outcome={homeOutcome} />

        <div
          className={`mx-auto min-w-[5.25rem] rounded-md px-2.5 py-1.5 text-center text-sm font-bold tabular-nums ${centerTone}`}
        >
          {centerText}
          {match.penalties ? (
            <p className="mt-0.5 text-[10px] font-semibold opacity-80">
              {match.penalties.home}-{match.penalties.away} pens
            </p>
          ) : null}
        </div>

        <TeamCell team={away} align="right" outcome={awayOutcome} />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-slate-500 lg:block lg:text-right">
        <span className="truncate font-bold text-slate-800 lg:block">
          {match.matchday}
        </span>
        <span className="truncate lg:block">{competitionName}</span>
        <span className="inline-flex min-w-0 items-center gap-1 truncate lg:justify-end">
          <FiMapPin
            className="h-3 w-3 shrink-0 text-blue-500"
            aria-hidden="true"
          />
          <span className="truncate">{venueName}</span>
        </span>
      </div>

      <span className="hidden h-7 w-7 items-center justify-center rounded-md text-slate-400 transition group-hover:bg-white group-hover:text-blue-700 lg:flex">
        <FiChevronRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function TeamCell({
  team,
  align,
  outcome,
}: {
  team: { name: string; shortName: string; logo: string };
  align: "left" | "right";
  outcome: "winner" | "muted" | "normal";
}) {
  const nameClass =
    outcome === "winner"
      ? "text-slate-900"
      : outcome === "muted"
        ? "text-slate-500"
        : "text-slate-900";

  const logoImage = (
    <Image
      src={team.logo}
      width={28}
      height={28}
      alt={`${team.name} logo`}
      className="h-7 w-7 shrink-0 object-contain"
    />
  );

  if (align === "right") {
    return (
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-right">
        <div className="min-w-0">
          <p className={`truncate text-sm font-bold ${nameClass}`}>
            {team.name}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            {team.shortName}
          </p>
        </div>
        {logoImage}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
      {logoImage}
      <div className="min-w-0">
        <p className={`truncate text-sm font-bold ${nameClass}`}>{team.name}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {team.shortName}
        </p>
      </div>
    </div>
  );
}

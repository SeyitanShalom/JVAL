import { FiCalendar } from "react-icons/fi";
import CompactFilterForm from "../components/CompactFilterForm";
import FilterSelect from "../components/FilterSelect";
import MatchCard from "../components/MatchCard";
import SectionHeader from "../components/SectionHeader";
import LiveFixturesSync from "./LiveFixturesSync";
import {
  getPublicCompetitionFilterLabel,
  getPublicFixturesData,
} from "@/lib/public-data";
import { type Match } from "@/lib/league-data";

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
              className="motion-panel overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
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
              <div className="motion-stagger grid gap-3 bg-slate-50/40 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    compact={match.status !== "live"}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="motion-panel rounded-lg border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
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


import FilterSelect from "../components/FilterSelect";
import MatchCard from "../components/MatchCard";
import SectionHeader from "../components/SectionHeader";
import ExportButton from "./ExportButton";
import { getPublicFixturesData } from "@/lib/public-data";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
  { value: "finished", label: "Finished" },
  { value: "postponed", label: "Postponed" },
];

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
  const selectedTeam = query.team ?? "all";
  const selectedMatchday = query.matchday ?? "all";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Match Center"
        title="Fixtures & Results"
        description="Neutral-venue fixtures, live match events, full-time scores, and penalty shootout records."
      />

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect
          label="Season"
          name="season"
          value={query.season ?? data.seasonsList[0].id}
          options={data.seasonsList.map((s) => ({ value: s.id, label: s.label }))}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...data.competitionsList.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FilterSelect label="Status" name="status" value={selectedStatus} options={statusOptions} />
        <FilterSelect
          label="Team"
          name="team"
          value={selectedTeam}
          options={[
            { value: "all", label: "All teams" },
            ...data.teamsList.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <FilterSelect
              label="Matchday"
              name="matchday"
              value={selectedMatchday}
              options={[
                { value: "all", label: "All rounds" },
                ...data.matchdays.map((m) => ({ value: m, label: m })),
              ]}
            />
          </div>
          <button
            className="h-10 rounded-lg bg-blue-700 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800"
            type="submit"
          >
            Apply
          </button>
        </div>
      </form>

      {/* Export row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">
          {data.matches.length} match{data.matches.length !== 1 ? "es" : ""} found
        </p>
        <ExportButton
          competition={selectedCompetition}
          status={selectedStatus}
          team={selectedTeam}
          matchday={selectedMatchday}
          season={query.season}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {data.matches.length ? (
          data.matches.map((match) => <MatchCard key={match.id} match={match} />)
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm lg:col-span-2">
            <p className="text-base font-bold text-slate-950">No matches found</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Try adjusting your filter by selecting another competition, team, or status.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

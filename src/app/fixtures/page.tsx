import FilterSelect from "../components/FilterSelect";
import MatchCard from "../components/MatchCard";
import SectionHeader from "../components/SectionHeader";
import {
  competitions,
  matches,
  seasons,
  teams,
  type MatchStatus,
} from "@/lib/league-data";

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
    status?: MatchStatus | "all";
    team?: string;
    matchday?: string;
  }>;
}) {
  const query = await searchParams;
  const selectedStatus = query.status ?? "all";
  const selectedCompetition = query.competition ?? "all";
  const selectedTeam = query.team ?? "all";
  const selectedMatchday = query.matchday ?? "all";

  const matchdays = Array.from(new Set(matches.map((match) => match.matchday)));
  const filteredMatches = matches.filter((match) => {
    const statusMatch = selectedStatus === "all" || match.status === selectedStatus;
    const competitionMatch = selectedCompetition === "all" || match.competitionId === selectedCompetition;
    const teamMatch =
      selectedTeam === "all" || match.homeTeamId === selectedTeam || match.awayTeamId === selectedTeam;
    const matchdayMatch = selectedMatchday === "all" || match.matchday === selectedMatchday;

    return statusMatch && competitionMatch && teamMatch && matchdayMatch;
  });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Match Center"
        title="Fixtures & Results"
        description="Live, upcoming, and completed matches across every competition and matchday."
      />

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect
          label="Season"
          name="season"
          value={query.season ?? seasons[0].id}
          options={seasons.map((season) => ({ value: season.id, label: season.label }))}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...competitions.map((competition) => ({ value: competition.id, label: competition.name })),
          ]}
        />
        <FilterSelect label="Status" name="status" value={selectedStatus} options={statusOptions} />
        <FilterSelect
          label="Team"
          name="team"
          value={selectedTeam}
          options={[{ value: "all", label: "All teams" }, ...teams.map((team) => ({ value: team.id, label: team.name }))]}
        />
        <div className="flex gap-3">
          <FilterSelect
            label="Matchday"
            name="matchday"
            value={selectedMatchday}
            options={[{ value: "all", label: "All matchdays" }, ...matchdays.map((matchday) => ({ value: matchday, label: matchday }))]}
          />
          <button className="mt-5 h-10 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white" type="submit">
            Apply
          </button>
        </div>
      </form>

      <div className="grid gap-3 lg:grid-cols-2">
        {filteredMatches.length ? (
          filteredMatches.map((match) => <MatchCard key={match.id} match={match} />)
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm lg:col-span-2">
            <p className="text-base font-black text-slate-950">No matches found</p>
            <p className="mt-2 text-sm text-slate-500">Try another competition, team, matchday, or status.</p>
          </div>
        )}
      </div>
    </section>
  );
}

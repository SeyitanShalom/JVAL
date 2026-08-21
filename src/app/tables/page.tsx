import FilterSelect from "../components/FilterSelect";
import LeagueTable from "../components/LeagueTable";
import SectionHeader from "../components/SectionHeader";
import { competitions, getCompetitionById, getTableRows, seasons } from "@/lib/league-data";

export default async function TablesPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const competitionId = query.competition ?? competitions[0].id;
  const selectedCompetition = getCompetitionById(competitionId) ?? competitions[0];
  const tableRows = getTableRows(selectedCompetition.id);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Standings"
        title="Tables"
        description="Ranking rules: points, goal difference, goals scored, then head-to-head."
      />

      <form className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <FilterSelect
          label="Season"
          name="season"
          value={query.season ?? seasons[0].id}
          options={seasons.map((season) => ({ value: season.id, label: season.label }))}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition.id}
          options={competitions.map((competition) => ({ value: competition.id, label: competition.name }))}
        />
        <button className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-black text-white" type="submit">
          Apply
        </button>
      </form>

      <div className="space-y-3">
        <SectionHeader title={selectedCompetition.name} />
        <LeagueTable teams={tableRows} />
      </div>
    </section>
  );
}

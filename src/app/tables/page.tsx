import FilterSelect from "../components/FilterSelect";
import LeagueTable from "../components/LeagueTable";
import SectionHeader from "../components/SectionHeader";
import { getPublicTablesData } from "@/lib/public-data";

export default async function TablesPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const data = await getPublicTablesData(query);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Standings"
        title="League Tables"
        description="Official ranking rules: Points, Goal Difference, Goals Scored, and Head-to-Head record."
      />

      <form className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <FilterSelect
          label="Season"
          name="season"
          value={query.season ?? data.seasonsList[0].id}
          options={data.seasonsList.map((s) => ({ value: s.id, label: s.label }))}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={data.selectedCompetition.id}
          options={data.competitionsList.map((c) => ({ value: c.id, label: c.name }))}
        />
        <button
          className="h-10 rounded-lg bg-blue-700 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800"
          type="submit"
        >
          View Standings
        </button>
      </form>

      <div className="space-y-3">
        <SectionHeader
          eyebrow={data.selectedCompetition.type}
          title={data.selectedCompetition.name}
          description={`Top ${data.selectedCompetition.qualifiers} teams advance to the knockout stage.`}
        />
        <LeagueTable teams={data.tableRows} />
      </div>
    </section>
  );
}

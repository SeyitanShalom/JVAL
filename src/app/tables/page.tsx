import CompactFilterForm from "../components/CompactFilterForm";
import FilterSelect from "../components/FilterSelect";
import LeagueTable from "../components/LeagueTable";
import SectionHeader from "../components/SectionHeader";
import { getPublicTablesData } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

      <CompactFilterForm
        resultLabel={data.selectedCompetition.name}
        submitLabel="View Standings"
      >
        <FilterSelect
          label="Season"
          name="season"
          value={query.season ?? data.seasonsList[0].id}
          options={data.seasonsList.map((s) => ({
            value: s.id,
            label: s.label,
          }))}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={data.selectedCompetition.id}
          options={data.competitionsList.map((c) => ({
            value: c.id,
            label: c.name,
          }))}
        />
      </CompactFilterForm>

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

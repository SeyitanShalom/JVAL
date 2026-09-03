import CompactFilterForm from "../components/CompactFilterForm";
import FilterSelect from "../components/FilterSelect";
import LeagueTable from "../components/LeagueTable";
import SectionHeader from "../components/SectionHeader";
import {
  getPublicCompetitionFilterLabel,
  getPublicTablesData,
} from "@/lib/public-data";

type TablesPageData = Awaited<ReturnType<typeof getPublicTablesData>>;
type TableSection = TablesPageData["sections"][number];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TablesPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const data = await getPublicTablesData(query);

  const selectedCompetition = query.competition ?? "all";
  const selectedSeason = query.season ?? data.seasonsList[0]?.id ?? "all";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Standings"
        title="League Phase Tables"
        description="Each competition has one league-phase table ranked by Points, Goal Difference, Goals Scored, and Head-to-Head record."
      />

      <CompactFilterForm
        resultLabel={`${data.sections.length} table${data.sections.length !== 1 ? "s" : ""}`}
        submitLabel="View Standings"
      >
        <FilterSelect
          label="Season"
          name="season"
          value={selectedSeason}
          options={[
            { value: "all", label: "All seasons" },
            ...data.seasonsList.map((s) => ({
              value: s.id,
              label: s.label,
            })),
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
      </CompactFilterForm>

      {data.sections.length ? (
        <div className="space-y-8">
          {data.sections.map((section) => (
            <section key={section.competition.id} className="space-y-3">
              <SectionHeader
                eyebrow={section.competition.type}
                title={section.competition.name}
                description={getTableDescription(section)}
              />

              {section.teams.length ? (
                <LeagueTable teams={section.teams} />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
                  {section.isPendingSuperCup
                    ? "Super Cup standings will appear here once the qualified teams begin playing."
                    : "No table data recorded for this competition yet."}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-sm font-semibold text-slate-500 shadow-sm">
          No competition tables available for this season yet.
        </div>
      )}
    </section>
  );
}

function getTableDescription(section: TableSection) {
  if (section.isPendingSuperCup) {
    return "The Super Cup table is kept separate and will show only qualified teams once that competition begins.";
  }

  const teamLabel = `${section.teams.length} team${
    section.teams.length !== 1 ? "s" : ""
  }`;

  return `${teamLabel} in one league-phase table. Top ${section.competition.qualifiers} teams advance to the knockout stage.`;
}

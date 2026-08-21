import FilterSelect from "../components/FilterSelect";
import SectionHeader from "../components/SectionHeader";
import { awardsRecords, competitions, getCompetitionById, seasons } from "@/lib/league-data";

export default async function AwardsRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const selectedCompetition = query.competition ?? "all";
  const selectedSeason = query.season ?? seasons[0].id;

  const visibleRecords = awardsRecords.filter((record) => {
    const seasonMatch = record.seasonId === selectedSeason;
    const competitionMatch = selectedCompetition === "all" || record.competitionId === selectedCompetition;

    return seasonMatch && competitionMatch;
  });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="History"
        title="Awards & Records"
        description="Season-by-season champions, awards, and notable records across every competition."
      />

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <FilterSelect
          label="Season"
          name="season"
          value={selectedSeason}
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
        <button className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-black text-white" type="submit">
          Apply
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleRecords.length ? (
          visibleRecords.map((record) => {
            const competition = getCompetitionById(record.competitionId);

            return (
              <article key={record.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">{competition?.name}</p>
                <h2 className="mt-2 text-xl font-black text-slate-950">{record.title}</h2>
                <p className="mt-3 text-lg font-black text-slate-800">{record.winner}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{record.detail}</p>
              </article>
            );
          })
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm md:col-span-2 xl:col-span-3">
            <p className="font-black text-slate-950">No record yet for this filter</p>
          </div>
        )}
      </div>
    </section>
  );
}

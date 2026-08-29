import FilterSelect from "../components/FilterSelect";
import SectionHeader from "../components/SectionHeader";
import { getCompetitionById } from "@/lib/league-data";
import { getPublicAwardsData } from "@/lib/public-data";

export default async function AwardsRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const data = await getPublicAwardsData(query);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Roll of Honour"
        title="Awards & Records"
        description="Celebrating champions, individual award winners, and historical tournament milestones."
      />

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <FilterSelect
          label="Season"
          name="season"
          value={data.selectedSeason}
          options={data.seasonsList.map((s) => ({
            value: s.id,
            label: s.label,
          }))}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={data.selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...data.competitionsList.map((c) => ({
              value: c.id,
              label: c.name,
            })),
          ]}
        />
        <button
          className="h-10 rounded-lg bg-red-500 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-red-600"
          type="submit"
        >
          Apply Filter
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.records.length ? (
          data.records.map((record) => {
            const competition = getCompetitionById(record.competitionId);

            return (
              <article
                key={record.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-red-300 hover:shadow-md"
              >
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-red-500">
                  {competition?.name ?? "Season Honour"}
                </span>
                <h2 className="mt-3 text-lg font-bold text-slate-950">
                  {record.title}
                </h2>
                <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
                  <p className="text-xs font-bold text-slate-400">
                    Winner / Holder
                  </p>
                  <p className="mt-0.5 text-base font-bold text-blue-700">
                    {record.winner}
                  </p>
                </div>
                {record.detail && (
                  <p className="mt-3 text-xs font-semibold leading-relaxed text-slate-500">
                    {record.detail}
                  </p>
                )}
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm md:col-span-2 xl:col-span-3">
            <p className="font-bold text-slate-950">
              No awards recorded yet for this selection.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

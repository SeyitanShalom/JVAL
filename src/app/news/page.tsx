import CompactFilterForm from "../components/CompactFilterForm";
import FilterSelect from "../components/FilterSelect";
import NewsCard from "../components/NewsCard";
import SectionHeader from "../components/SectionHeader";
import {
  getPublicCompetitionFilterLabel,
  getPublicNewsData,
} from "@/lib/public-data";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const data = await getPublicNewsData(query);

  const selectedCompetition = query.competition ?? "all";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Updates & Reports"
        title="News & Articles"
        description="Official tournament announcements, matchday reports, interviews, and feature stories."
      />

      <CompactFilterForm
        resultLabel={`${data.posts.length} article${data.posts.length !== 1 ? "s" : ""}`}
        submitLabel="Filter News"
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.posts.map((post, index) => (
          <NewsCard key={post.id} post={post} large={index === 0} />
        ))}
        {data.posts.length === 0 && (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center text-sm font-semibold text-slate-500">
            No news articles published for this filter yet.
          </div>
        )}
      </div>
    </section>
  );
}

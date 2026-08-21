import FilterSelect from "../components/FilterSelect";
import NewsCard from "../components/NewsCard";
import SectionHeader from "../components/SectionHeader";
import { competitions, newsPosts, seasons } from "@/lib/league-data";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const selectedCompetition = query.competition ?? "all";
  const visiblePosts =
    selectedCompetition === "all"
      ? newsPosts
      : newsPosts.filter((post) => post.competitionId === selectedCompetition);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Updates"
        title="News"
        description="Competition-linked news, match reports, announcements, and tournament stories."
      />

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
        <button className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-black text-white" type="submit">
          Apply
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visiblePosts.map((post, index) => (
          <NewsCard key={post.id} post={post} large={index === 0} />
        ))}
      </div>
    </section>
  );
}

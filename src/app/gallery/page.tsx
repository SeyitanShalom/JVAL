import Image from "next/image";
import FilterSelect from "../components/FilterSelect";
import SectionHeader from "../components/SectionHeader";
import { competitions, galleryItems, seasons } from "@/lib/league-data";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string; scope?: string }>;
}) {
  const query = await searchParams;
  const selectedCompetition = query.competition ?? "all";
  const selectedScope = query.scope ?? "all";

  const scopes = Array.from(new Set(galleryItems.map((item) => item.scope)));
  const visibleItems = galleryItems.filter((item) => {
    const competitionMatch = selectedCompetition === "all" || item.competitionId === selectedCompetition;
    const scopeMatch = selectedScope === "all" || item.scope === selectedScope;

    return competitionMatch && scopeMatch;
  });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Photos"
        title="Gallery"
        description="Images can be linked to seasons, competitions, matches, teams, players, venues, or general site content."
      />

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
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
        <FilterSelect
          label="Scope"
          name="scope"
          value={selectedScope}
          options={[{ value: "all", label: "All scopes" }, ...scopes.map((scope) => ({ value: scope, label: scope }))]}
        />
        <button className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-black text-white" type="submit">
          Apply
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item) => (
          <figure key={item.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-[4/3] bg-slate-100">
              <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
            <figcaption className="p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">{item.scope}</p>
              <p className="mt-1 text-base font-black text-slate-950">{item.title}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

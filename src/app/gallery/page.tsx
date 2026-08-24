import Image from "next/image";
import FilterSelect from "../components/FilterSelect";
import SectionHeader from "../components/SectionHeader";
import { getPublicGalleryData } from "@/lib/public-data";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string; scope?: string }>;
}) {
  const query = await searchParams;
  const data = await getPublicGalleryData(query);

  const selectedCompetition = query.competition ?? "all";
  const selectedScope = query.scope ?? "all";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Media Hub"
        title="Photo Gallery"
        description="Capturing tournament highlights, matchday action, trophy moments, and team portraits."
      />

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <FilterSelect
          label="Season"
          name="season"
          value={query.season ?? data.seasonsList[0].id}
          options={data.seasonsList.map((s) => ({ value: s.id, label: s.label }))}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...data.competitionsList.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FilterSelect
          label="Scope"
          name="scope"
          value={selectedScope}
          options={[
            { value: "all", label: "All categories" },
            ...data.scopes.map((s) => ({ value: s, label: s })),
          ]}
        />
        <button
          className="h-10 rounded-lg bg-blue-700 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800"
          type="submit"
        >
          Filter
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((item) => (
          <figure
            key={item.id}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute top-3 right-3 rounded-full bg-slate-950/70 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
                {item.scope}
              </span>
            </div>
            <figcaption className="p-4">
              <h2 className="text-sm font-bold text-slate-950 group-hover:text-blue-600 transition">
                {item.title}
              </h2>
            </figcaption>
          </figure>
        ))}
        {data.items.length === 0 && (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm font-semibold text-slate-500">
            No gallery photos found for the selected filter.
          </div>
        )}
      </div>
    </section>
  );
}

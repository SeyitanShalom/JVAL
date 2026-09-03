import Link from "next/link";
import { FiMapPin, FiCalendar } from "react-icons/fi";
import SectionHeader from "../components/SectionHeader";
import { getPublicVenuesData } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VenuesPage() {
  const venuesList = await getPublicVenuesData();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Neutral Grounds"
        title="Match Venues"
        description="All tournament fixtures are played at designated neutral venues with pitch management and referee supervision."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {venuesList.map((venue) => (
          <article
            key={venue.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-red-300 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
                <FiMapPin className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-slate-950">
                  {venue.name}
                </h2>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {venue.location}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <FiCalendar className="text-red-500" />
                <span>{venue.matchCount} matches scheduled</span>
              </div>
              <Link
                href="/fixtures"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View fixtures &rarr;
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

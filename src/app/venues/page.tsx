import { FiMapPin } from "react-icons/fi";
import SectionHeader from "../components/SectionHeader";
import { matches, venues } from "@/lib/league-data";

export default function VenuesPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Neutral Grounds"
        title="Venues"
        description="Tournament matches are played at neutral venues managed by the competition admin."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {venues.map((venue) => {
          const venueMatches = matches.filter((match) => match.venueId === venue.id);

          return (
            <article key={venue.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
                  <FiMapPin aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950">{venue.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{venue.location}</p>
                </div>
              </div>
              <p className="mt-5 text-sm font-bold text-slate-700">{venueMatches.length} scheduled matches</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

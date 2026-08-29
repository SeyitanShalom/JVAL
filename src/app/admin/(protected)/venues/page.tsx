import { FiMapPin } from "react-icons/fi";
import { MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import { getAdminVenueData } from "@/lib/admin-venues";
import { CreateVenueButton, EditVenueButton } from "./VenueModals";

export default async function AdminVenuesPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    updated?: string;
  }>;
}) {
  const [query, venueData] = await Promise.all([
    searchParams,
    getAdminVenueData(),
  ]);
  const canWrite = venueData.databaseReady;
  const message = getPageMessage(query, venueData.error);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Locations"
        title="Venues"
        description="Manage neutral match venues with venue name and location."
        action={<CreateVenueButton canWrite={canWrite} />}
      />

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-bold ${
            message.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Venues"
          value={venueData.venues.length}
          detail={
            venueData.source === "database" ? "Database" : "Sample preview"
          }
        />
        <MetricCard
          label="Scheduled"
          value={venueData.scheduledVenueCount}
          detail="Used in fixtures"
        />
        <MetricCard
          label="Matches"
          value={venueData.totalMatches}
          detail="Neutral venues"
        />
        <MetricCard
          label="Write mode"
          value={canWrite ? "On" : "Off"}
          detail={canWrite ? "Prisma connected" : "Needs Supabase env"}
        />
      </section>

      <div className="grid gap-3">
        {venueData.venues.length ? (
          venueData.venues.map((venue) => (
            <article
              key={venue.id}
              className="flex min-w-0 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <FiMapPin className="h-5 w-5" aria-hidden="true" />
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-slate-950">
                  {venue.name}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-500">
                  {venue.location}
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                  {venue.slug}
                </p>
              </div>

              {/* Match count */}
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-slate-950">
                  {venue.matchCount}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Matches
                </p>
              </div>

              {/* Edit trigger */}
              <EditVenueButton venue={venue} canWrite={canWrite} />
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-sm font-bold text-slate-500">
              No venues yet.{" "}
              <span className="text-red-500">
                Click &quot;+ Venue&quot; above to add the first one.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getPageMessage(
  query: {
    created?: string;
    deleted?: string;
    error?: string;
    updated?: string;
  },
  fallbackError?: string,
) {
  if (query.created)
    return { tone: "success" as const, text: "Venue created." };
  if (query.updated)
    return { tone: "success" as const, text: "Venue updated." };
  if (query.deleted)
    return { tone: "success" as const, text: "Venue deleted." };
  if (query.error === "missing")
    return {
      tone: "warning" as const,
      text: "Venue name and location are required.",
    };
  if (query.error === "database")
    return {
      tone: "warning" as const,
      text: "Database is not connected yet. Add Supabase env values before saving venues.",
    };
  if (query.error === "save")
    return {
      tone: "warning" as const,
      text: "Venue could not be saved. Check the database connection.",
    };
  if (query.error === "delete")
    return {
      tone: "warning" as const,
      text: "Venue could not be deleted. It may already be used by scheduled matches.",
    };
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}

import { FiMapPin } from "react-icons/fi";
import { MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import { getAdminVenueData } from "@/lib/admin-venues";
import { CreateVenueButton, EditVenueButton } from "./VenueModals";
import { requireAdminSession } from "@/lib/admin-auth";
import { hasAdminPermission } from "@/lib/admin-permissions";

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
  const [query, venueData, session] = await Promise.all([
    searchParams,
    getAdminVenueData(),
    requireAdminSession(),
  ]);
  const canWrite = venueData.databaseReady;
  const canDeleteCritical =
    canWrite && hasAdminPermission(session.role, "deleteCriticalData");
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
            venueData.source === "database" ? "Database" : "Setup required"
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
              className="rounded-lg border border-slate-200 bg-white p-3 sm:flex sm:min-w-0 sm:items-center sm:gap-4 sm:p-4"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 sm:h-12 sm:w-12">
                  <FiMapPin className="h-5 w-5" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-bold text-slate-950 sm:text-base">
                    {venue.name}
                  </p>
                  <p className="mt-0.5 break-words text-xs font-semibold text-slate-500 sm:text-sm">
                    {venue.location}
                  </p>
                  <p className="mt-0.5 break-all text-xs font-semibold text-slate-400">
                    {venue.slug}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:mt-0 sm:border-t-0 sm:pt-0">
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-base font-bold text-slate-950 sm:text-lg">
                    {venue.matchCount}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Matches
                  </p>
                </div>

                <EditVenueButton
                  venue={venue}
                  canWrite={canWrite}
                  canDelete={canDeleteCritical}
                />
              </div>
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

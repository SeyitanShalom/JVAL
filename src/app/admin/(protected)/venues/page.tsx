import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import { createVenue, deleteVenue, updateVenue } from "./actions";
import { getAdminVenueData } from "@/lib/admin-venues";

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
  const [query, venueData] = await Promise.all([searchParams, getAdminVenueData()]);
  const canWrite = venueData.databaseReady;
  const message = getPageMessage(query, venueData.error);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Locations"
        title="Venues"
        description="Manage neutral match venues with venue name and location."
        action={
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white">
            <FiPlus aria-hidden="true" />
            Venue
          </button>
        }
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
        <MetricCard label="Venues" value={venueData.venues.length} detail={venueData.source === "database" ? "Database" : "Sample preview"} />
        <MetricCard label="Scheduled" value={venueData.scheduledVenueCount} detail="Used in fixtures" />
        <MetricCard label="Matches" value={venueData.totalMatches} detail="Neutral venues" />
        <MetricCard label="Write mode" value={canWrite ? "On" : "Off"} detail={canWrite ? "Prisma connected" : "Needs Supabase env"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel title="Venue List">
          <div className="grid gap-3">
            {venueData.venues.length ? (
              venueData.venues.map((venue) => (
                <article key={venue.id} className="min-w-0 rounded-lg border border-slate-200 p-4">
                  <form action={updateVenue.bind(null, venue.id)} className="grid gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="break-words text-base font-black text-slate-950">{venue.name}</h2>
                        <p className="mt-1 break-words text-sm font-bold text-slate-500">{venue.location}</p>
                        <p className="mt-1 break-all text-xs font-bold text-slate-400">{venue.slug}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-black text-slate-950">{venue.matchCount}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Matches</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <VenueInput defaultValue={venue.name} disabled={!canWrite} label="Venue name" name="name" />
                      <VenueInput defaultValue={venue.location} disabled={!canWrite} label="Location" name="location" />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={!canWrite}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        <FiSave aria-hidden="true" />
                        Save changes
                      </button>
                    </div>
                  </form>

                  <form action={deleteVenue.bind(null, venue.id)} className="mt-2">
                    <button
                      type="submit"
                      disabled={!canWrite || venue.matchCount > 0}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 sm:w-auto"
                    >
                      <FiTrash2 aria-hidden="true" />
                      {venue.matchCount > 0 ? "Cannot delete scheduled venue" : "Delete venue"}
                    </button>
                  </form>
                </article>
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 p-6 text-sm font-bold text-slate-500">
                No venues found yet.
              </div>
            )}
          </div>
        </AdminPanel>

        <AdminPanel title="Create Venue">
          <form action={createVenue} className="grid gap-4">
            <VenueInput disabled={!canWrite} label="Venue name" name="name" placeholder="Venue name" />
            <VenueInput disabled={!canWrite} label="Location" name="location" placeholder="City, state" />
            <button
              type="submit"
              disabled={!canWrite}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <FiPlus aria-hidden="true" />
              Create venue
            </button>

            {!canWrite ? (
              <p className="rounded-lg bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-600">
                Add Supabase connection values to `.env`, then run `npm run prisma:migrate` and `npm run db:seed` to enable writes.
              </p>
            ) : null}
          </form>
        </AdminPanel>
      </section>
    </div>
  );
}

function VenueInput({
  defaultValue,
  disabled,
  label,
  name,
  placeholder,
}: {
  defaultValue?: string;
  disabled: boolean;
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-black text-slate-700">
      {label}
      <input
        className="h-11 min-w-0 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
        defaultValue={defaultValue}
        disabled={disabled}
        name={name}
        placeholder={placeholder}
      />
    </label>
  );
}

function getPageMessage(
  query: { created?: string; deleted?: string; error?: string; updated?: string },
  fallbackError?: string
) {
  if (query.created) {
    return { tone: "success" as const, text: "Venue created." };
  }

  if (query.updated) {
    return { tone: "success" as const, text: "Venue updated." };
  }

  if (query.deleted) {
    return { tone: "success" as const, text: "Venue deleted." };
  }

  if (query.error === "missing") {
    return { tone: "warning" as const, text: "Venue name and location are required." };
  }

  if (query.error === "database") {
    return { tone: "warning" as const, text: "Database is not connected yet. Add Supabase env values before saving venues." };
  }

  if (query.error === "save") {
    return { tone: "warning" as const, text: "Venue could not be saved. Check the database connection and migration status." };
  }

  if (query.error === "delete") {
    return { tone: "warning" as const, text: "Venue could not be deleted. It may already be used by scheduled matches." };
  }

  if (fallbackError) {
    return { tone: "warning" as const, text: fallbackError };
  }

  return null;
}

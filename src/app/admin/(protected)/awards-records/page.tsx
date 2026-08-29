import { MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "../../components/AdminModalButtons";
import { getAdminAwardsData } from "@/lib/admin-awards";
import { createAward, deleteAward, updateAward } from "./actions";

export default async function AdminAwardsRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const [query, data] = await Promise.all([searchParams, getAdminAwardsData()]);
  const canWrite = data.databaseReady;
  const message = getPageMessage(query, data.error);

  const currentSeasonAwards = data.awards.filter(
    (a) => a.seasonId === data.currentSeasonId,
  );

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Honours"
        title="Awards and records"
        description="Track awards and records per season, with optional competition, player, and team references."
        action={
          <AddButton
            label="Entry"
            title="Add Award or Record"
            description="Record a season honour or tournament record."
          >
            <AwardForm
              action={createAward}
              canWrite={canWrite}
              competitionOptions={data.competitionOptions}
              seasonOptions={data.seasonOptions}
              currentSeasonId={data.currentSeasonId}
            />
          </AddButton>
        }
      />

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-bold ${message.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Entries"
          value={data.awards.length}
          detail={data.source === "database" ? "Database" : "Sample preview"}
        />
        <MetricCard
          label="Current season"
          value={currentSeasonAwards.length}
          detail="Active season"
        />
        <MetricCard
          label="Seasons"
          value={new Set(data.awards.map((a) => a.seasonId)).size}
          detail="Tracked"
        />
        <MetricCard
          label="Write mode"
          value={canWrite ? "On" : "Off"}
          detail={canWrite ? "Prisma connected" : "Needs Supabase env"}
        />
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        {data.awards.map((award) => (
          <article
            key={award.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">
                  {award.competitionName ?? "Season-wide"}
                </p>
                <h2 className="mt-1 text-base font-bold text-slate-950">
                  {award.title}
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-600">
                  {award.winnerText}
                </p>
                {award.detail && (
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    {award.detail}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <div className="flex items-center gap-1.5">
                  <AdminStatusBadge tone="slate">{award.type}</AdminStatusBadge>
                  <AdminStatusBadge
                    tone={
                      award.seasonId === data.currentSeasonId
                        ? "green"
                        : "slate"
                    }
                  >
                    {award.seasonLabel}
                  </AdminStatusBadge>
                </div>
                <div className="flex gap-1.5">
                  <EditButton title={`Edit — ${award.title}`} compact>
                    <AwardForm
                      award={award}
                      action={updateAward.bind(null, award.id)}
                      canWrite={canWrite}
                      competitionOptions={data.competitionOptions}
                      seasonOptions={data.seasonOptions}
                      currentSeasonId={data.currentSeasonId}
                    />
                  </EditButton>
                  <DeleteButton
                    title="Delete Entry"
                    itemLabel={award.title}
                    action={deleteAward.bind(null, award.id)}
                    disabled={!canWrite}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
        {data.awards.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-sm font-bold text-slate-500">
              No entries yet.{" "}
              <span className="text-red-500">
                Click &quot;+ Entry&quot; to add the first award.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AwardForm({
  award,
  action,
  canWrite,
  competitionOptions,
  seasonOptions,
  currentSeasonId,
}: {
  award?: {
    title: string;
    winnerText: string;
    detail: string;
    type: string;
    competitionId: string | null;
    seasonId: string;
  };
  action: (fd: FormData) => Promise<void>;
  canWrite: boolean;
  competitionOptions: { id: string; name: string }[];
  seasonOptions: { id: string; label: string }[];
  currentSeasonId: string | null;
}) {
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Title
        <input
          name="title"
          defaultValue={award?.title}
          disabled={!canWrite}
          className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
          placeholder="e.g. Golden Boot"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Winner / Value
        <input
          name="winnerText"
          defaultValue={award?.winnerText}
          disabled={!canWrite}
          className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
          placeholder="Player name, team name, or record value"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {!award && (
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Season
            <select
              name="seasonId"
              defaultValue={currentSeasonId ?? undefined}
              disabled={!canWrite || seasonOptions.length === 0}
              className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
            >
              {seasonOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Type
          <select
            name="type"
            defaultValue={award?.type ?? "AWARD"}
            disabled={!canWrite}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
          >
            <option value="AWARD">Award</option>
            <option value="RECORD">Record</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Competition (optional)
        <select
          name="competitionId"
          defaultValue={award?.competitionId ?? ""}
          disabled={!canWrite}
          className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
        >
          <option value="">Season-wide</option>
          {competitionOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Detail
        <textarea
          name="detail"
          defaultValue={award?.detail}
          disabled={!canWrite}
          className="min-h-24 rounded-lg border border-slate-200 px-3 py-3 font-semibold leading-6 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
          placeholder="Award or record detail"
        />
      </label>
      {!canWrite && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Connect Supabase in <code>.env</code> to enable writes.
        </p>
      )}
      <button
        type="submit"
        disabled={!canWrite}
        className="h-11 rounded-lg bg-red-500 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {award ? "Save changes" : "Create entry"}
      </button>
    </form>
  );
}

function getPageMessage(
  query: {
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  },
  fallbackError?: string,
) {
  if (query.created)
    return { tone: "success" as const, text: "Entry created." };
  if (query.updated)
    return { tone: "success" as const, text: "Entry updated." };
  if (query.deleted)
    return { tone: "success" as const, text: "Entry deleted." };
  if (query.error === "missing")
    return {
      tone: "warning" as const,
      text: "Title, winner, and season are required.",
    };
  if (query.error === "database")
    return { tone: "warning" as const, text: "Database not connected." };
  if (query.error === "save")
    return { tone: "warning" as const, text: "Could not save entry." };
  if (query.error === "delete")
    return { tone: "warning" as const, text: "Could not delete entry." };
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}

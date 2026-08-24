import Image from "next/image";
import { MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { AddButton, DeleteButton, EditButton } from "../../components/AdminModalButtons";
import { ImageUploadInput } from "../../components/ImageUploadInput";
import { getAdminGalleryData } from "@/lib/admin-galleries";
import { createGalleryImage, deleteGalleryImage, updateGalleryImage } from "./actions";

export default async function AdminGalleriesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string; deleted?: string; error?: string }>;
}) {
  const [query, data] = await Promise.all([searchParams, getAdminGalleryData()]);
  const canWrite = data.databaseReady;
  const message = getPageMessage(query, data.error);

  const scopeCount = new Set(data.images.map((img) => img.scope)).size;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Media"
        title="Photo galleries"
        description="Upload and organize photos by season, competition, match, team, player, venue, or general site use."
        action={
          <AddButton label="Image" title="Upload Gallery Image" description="Add a photo to the gallery.">
            <GalleryForm
              action={createGalleryImage}
              canWrite={canWrite}
              competitionOptions={data.competitionOptions}
              seasonOptions={data.seasonOptions}
              currentSeasonId={data.currentSeasonId}
              scopeOptions={data.scopeOptions}
            />
          </AddButton>
        }
      />

      {message ? (
        <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${message.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {message.text}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Images" value={data.images.length} detail={data.source === "database" ? "Database" : "Sample preview"} />
        <MetricCard label="Scopes used" value={scopeCount} detail="Flexible associations" />
        <MetricCard label="Competitions" value={data.competitionOptions.length} detail="Can attach photos" />
        <MetricCard label="Cloudinary" value="Ready" detail="Upload fields mapped" />
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.images.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="relative">
              <Image
                src={item.imageUrl}
                alt={item.altText}
                width={420}
                height={260}
                className="h-48 w-full object-cover"
              />
              <div className="absolute right-2 top-2">
                <AdminStatusBadge tone="blue">{item.scope}</AdminStatusBadge>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-slate-950">{item.title}</h2>
                  <p className="mt-0.5 truncate text-xs font-bold text-slate-500">
                    {item.competitionName ?? "General"}
                    {item.seasonLabel ? ` · ${item.seasonLabel}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <EditButton title={`Edit — ${item.title}`} compact>
                    <GalleryForm
                      item={item}
                      action={updateGalleryImage.bind(null, item.id)}
                      canWrite={canWrite}
                      competitionOptions={data.competitionOptions}
                      seasonOptions={data.seasonOptions}
                      currentSeasonId={data.currentSeasonId}
                      scopeOptions={data.scopeOptions}
                    />
                  </EditButton>
                  <DeleteButton
                    title="Delete Image"
                    itemLabel={item.title}
                    action={deleteGalleryImage.bind(null, item.id)}
                    disabled={!canWrite}
                  />
                </div>
              </div>
            </div>
          </article>
        ))}
        {data.images.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-sm font-bold text-slate-500">No images yet. <span className="text-blue-600">Click &quot;+ Image&quot; to upload the first photo.</span></p>
          </div>
        )}
      </div>
    </div>
  );
}

function GalleryForm({
  item,
  action,
  canWrite,
  competitionOptions,
  seasonOptions,
  currentSeasonId,
  scopeOptions,
}: {
  item?: {
    title: string;
    altText: string;
    scope: string;
    imageUrl?: string;
    seasonId: string | null;
    competitionId: string | null;
  };
  action: (fd: FormData) => Promise<void>;
  canWrite: boolean;
  competitionOptions: { id: string; name: string }[];
  seasonOptions: { id: string; label: string }[];
  currentSeasonId: string | null;
  scopeOptions: string[];
}) {
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Title
        <input name="title" defaultValue={item?.title} disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100" placeholder="Photo title" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Alt text
        <input name="altText" defaultValue={item?.altText} disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100" placeholder="Accessible description" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Scope
          <select name="scope" defaultValue={item?.scope ?? "GENERAL"} disabled={!canWrite} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100">
            {scopeOptions.map((scope) => <option key={scope} value={scope}>{scope.charAt(0) + scope.slice(1).toLowerCase()}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Season (optional)
          <select
            name="seasonId"
            defaultValue={item?.seasonId ?? currentSeasonId ?? ""}
            disabled={!canWrite}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
          >
            <option value="">None</option>
            {seasonOptions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Competition (optional)
        <select
          name="competitionId"
          defaultValue={item?.competitionId ?? ""}
          disabled={!canWrite}
          className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
        >
          <option value="">None</option>
          {competitionOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <ImageUploadInput
        name="imageUrl"
        label="Gallery Photo"
        initialUrl={item?.imageUrl}
        disabled={!canWrite}
        aspectRatio="landscape"
      />
      {!canWrite && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Connect Supabase in <code>.env</code> to enable writes.</p>}
      <button type="submit" disabled={!canWrite} className="h-11 rounded-lg bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">
        {item ? "Save changes" : "Add image"}
      </button>
    </form>
  );
}

function getPageMessage(
  query: { created?: string; updated?: string; deleted?: string; error?: string },
  fallbackError?: string
) {
  if (query.created) return { tone: "success" as const, text: "Image added to gallery." };
  if (query.updated) return { tone: "success" as const, text: "Image updated." };
  if (query.deleted) return { tone: "success" as const, text: "Image deleted." };
  if (query.error === "missing") return { tone: "warning" as const, text: "Title is required." };
  if (query.error === "database") return { tone: "warning" as const, text: "Database not connected." };
  if (query.error === "save") return { tone: "warning" as const, text: "Could not save image." };
  if (query.error === "delete") return { tone: "warning" as const, text: "Could not delete image." };
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}

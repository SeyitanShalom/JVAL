import Image from "next/image";
import { MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "../../components/AdminModalButtons";
import { ImageUploadInput } from "../../components/ImageUploadInput";
import { getAdminNewsData } from "@/lib/admin-news";
import { createNewsPost, deleteNewsPost, updateNewsPost } from "./actions";

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const [query, data] = await Promise.all([searchParams, getAdminNewsData()]);
  const canWrite = data.databaseReady;
  const message = getPageMessage(query, data.error);

  const latestPost = data.posts[0];

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Editorial"
        title="News posts"
        description="Manage tournament news with cover images, publish dates, content, and competition links."
        action={
          <AddButton
            label="Post"
            title="Create News Post"
            description="Publish a new tournament news article."
          >
            <NewsForm
              action={createNewsPost}
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
          label="Posts"
          value={data.posts.length}
          detail={data.source === "database" ? "Database" : "Setup required"}
        />
        <MetricCard
          label="Competitions linked"
          value={new Set(data.posts.map((p) => p.competitionId)).size}
          detail="Scoped articles"
        />
        <MetricCard
          label="Latest"
          value={
            latestPost
              ? new Date(latestPost.publishDate).toLocaleDateString("en-GB")
              : "—"
          }
          detail={latestPost?.title ?? "None"}
        />
        <MetricCard
          label="Write mode"
          value={canWrite ? "On" : "Off"}
          detail={canWrite ? "Prisma connected" : "Needs Supabase env"}
        />
      </section>

      <div className="grid gap-3">
        {data.posts.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div className="grid sm:grid-cols-[160px_1fr]">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                width={320}
                height={200}
                className="h-44 w-full object-cover sm:h-full"
              />
              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">
                      {post.competitionName}
                    </p>
                    <h2 className="mt-1 text-base font-bold text-slate-950">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-400">
                      {new Date(post.publishDate).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <EditButton title={`Edit — ${post.title}`} compact>
                      <NewsForm
                        post={post}
                        action={updateNewsPost.bind(null, post.id)}
                        canWrite={canWrite}
                        competitionOptions={data.competitionOptions}
                        seasonOptions={data.seasonOptions}
                        currentSeasonId={data.currentSeasonId}
                      />
                    </EditButton>
                    <DeleteButton
                      title="Delete Post"
                      itemLabel={post.title}
                      action={deleteNewsPost.bind(null, post.id)}
                      disabled={!canWrite}
                    />
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
        {data.posts.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-sm font-bold text-slate-500">
              No posts yet.{" "}
              <span className="text-red-500">
                Click &quot;+ Post&quot; to write the first article.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewsForm({
  post,
  action,
  canWrite,
  competitionOptions,
  seasonOptions,
  currentSeasonId,
}: {
  post?: {
    title: string;
    content: string;
    publishDate: string;
    competitionId: string;
    seasonId: string;
    coverImageUrl?: string;
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
          defaultValue={post?.title}
          disabled={!canWrite}
          className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
          placeholder="News title"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Publish date
          <input
            type="date"
            name="publishDate"
            defaultValue={post?.publishDate.split("T")[0]}
            disabled={!canWrite}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Competition
          <select
            name="competitionId"
            defaultValue={post?.competitionId}
            disabled={!canWrite || competitionOptions.length === 0}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
          >
            {competitionOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!post && (
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Season
          <select
            name="seasonId"
            defaultValue={currentSeasonId ?? undefined}
            disabled={!canWrite || seasonOptions.length === 0}
            className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
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
        Content
        <textarea
          name="content"
          defaultValue={post?.content}
          disabled={!canWrite}
          className="min-h-32 rounded-lg border border-slate-200 px-3 py-3 font-semibold leading-6 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
          placeholder="Write match report or tournament update"
        />
      </label>
      <ImageUploadInput
        name="coverImageUrl"
        label="Cover Banner Image"
        initialUrl={post?.coverImageUrl}
        disabled={!canWrite}
        aspectRatio="landscape"
      />
      {!canWrite && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Connect Supabase in <code>.env</code> to enable writes.
        </p>
      )}
      <button
        type="submit"
        disabled={!canWrite}
        className="h-10 rounded-lg bg-blue-700 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {post ? "Save changes" : "Publish post"}
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
    return { tone: "success" as const, text: "Post published." };
  if (query.updated) return { tone: "success" as const, text: "Post updated." };
  if (query.deleted) return { tone: "success" as const, text: "Post deleted." };
  if (query.error === "missing")
    return {
      tone: "warning" as const,
      text: "Title, competition, season, and cover image are required.",
    };
  if (query.error === "database")
    return { tone: "warning" as const, text: "Database not connected." };
  if (query.error === "save")
    return { tone: "warning" as const, text: "Could not save post." };
  if (query.error === "delete")
    return { tone: "warning" as const, text: "Could not delete post." };
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}

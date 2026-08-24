import Image from "next/image";
import { FiPlus, FiUpload } from "react-icons/fi";
import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import { competitions, formatDate, getCompetitionById, newsPosts } from "@/lib/league-data";

export default function AdminNewsPage() {
  const latestPost = [...newsPosts].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())[0];

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Editorial"
        title="News posts"
        description="Manage tournament news with cover images, publish dates, content, and competition links."
        action={
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white">
            <FiPlus aria-hidden="true" />
            Post
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Posts" value={newsPosts.length} detail="Published sample" />
        <MetricCard label="Competitions linked" value={new Set(newsPosts.map((post) => post.competitionId)).size} detail="No categories" />
        <MetricCard label="Latest" value={latestPost ? formatDate(latestPost.publishDate) : "-"} detail={latestPost?.title ?? "None"} />
        <MetricCard label="Draft fields" value="4" detail="Title, image, date, content" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminPanel title="Post List">
          <div className="grid gap-3">
            {newsPosts.map((post) => (
              <article key={post.id} className="overflow-hidden rounded-lg border border-slate-200">
                <div className="grid gap-0 sm:grid-cols-[150px_1fr]">
                  <Image src={post.coverImage} alt={post.title} width={300} height={180} className="h-40 w-full object-cover sm:h-full" />
                  <div className="p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">
                      {getCompetitionById(post.competitionId)?.name}
                    </p>
                    <h2 className="mt-2 text-base font-black text-slate-950">{post.title}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{post.excerpt}</p>
                    <p className="mt-3 text-xs font-black text-slate-500">{formatDate(post.publishDate)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Post Form">
          <form className="grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Title
              <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="News title" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Publish date
                <input type="date" className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Competition
                <select className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
                  {competitions.map((competition) => (
                    <option key={competition.id}>{competition.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Content
              <textarea className="min-h-40 rounded-lg border border-slate-200 px-3 py-3 font-semibold leading-6 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Write match report or tournament update" />
            </label>
            <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-sm font-black text-slate-600">
              <FiUpload aria-hidden="true" />
              Upload cover image
            </button>
          </form>
        </AdminPanel>
      </section>
    </div>
  );
}

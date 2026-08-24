import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiCalendar, FiTag } from "react-icons/fi";
import SectionHeader from "@/app/components/SectionHeader";
import { formatDate, newsPosts } from "@/lib/league-data";
import { getPublicNewsDetail } from "@/lib/public-data";

export function generateStaticParams() {
  return newsPosts.map((post) => ({ slug: post.slug }));
}

export default async function NewsDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicNewsDetail(slug);

  if (!data) {
    notFound();
  }

  const { post, competition } = data;

  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 transition hover:underline mb-4"
        >
          <FiArrowLeft aria-hidden="true" />
          Back to all news
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 font-bold text-blue-700">
            <FiTag aria-hidden="true" className="h-3 w-3" />
            {competition?.name ?? "Apex League"}
          </span>
          <span className="inline-flex items-center gap-1">
            <FiCalendar aria-hidden="true" className="h-3 w-3 text-slate-400" />
            {formatDate(post.publishDate)}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-950 sm:text-4xl leading-tight">
          {post.title}
        </h1>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100 shadow-md">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(max-width: 1024px) 100vw, 896px"
          priority
          className="object-cover"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="space-y-5 text-base font-semibold leading-relaxed text-slate-700">
          {Array.isArray(post.content) ? (
            post.content.map((paragraph, index) => <p key={index}>{paragraph}</p>)
          ) : (
            <p>{post.content}</p>
          )}
        </div>
      </div>
    </article>
  );
}

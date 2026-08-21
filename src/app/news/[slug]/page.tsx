import Image from "next/image";
import { notFound } from "next/navigation";
import SectionHeader from "@/app/components/SectionHeader";
import {
  formatDate,
  getCompetitionById,
  getNewsPostBySlug,
  newsPosts,
} from "@/lib/league-data";

export function generateStaticParams() {
  return newsPosts.map((post) => ({ slug: post.slug }));
}

export default async function NewsDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getNewsPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const competition = getCompetitionById(post.competitionId);

  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader eyebrow={competition?.name ?? "Apex League"} title={post.title} description={formatDate(post.publishDate)} />
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
        <Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 1024px) 100vw, 896px" className="object-cover" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <div className="space-y-5 text-base font-semibold leading-8 text-slate-700">
          {post.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}

import Image from "next/image";
import Link from "next/link";
import {
  formatDate,
  getCompetitionById,
  type NewsPost,
} from "@/lib/league-data";

type NewsCardProps = {
  post: NewsPost;
  large?: boolean;
};

export default function NewsCard({ post, large = false }: NewsCardProps) {
  const competition = getCompetitionById(post.competitionId);

  return (
    <Link
      href={`/news/${post.slug}`}
      className={`grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-red-500 hover:shadow-md ${
        large ? "md:grid-cols-[1.1fr_1fr]" : ""
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes={
            large
              ? "(max-width: 768px) 100vw, 45vw"
              : "(max-width: 768px) 100vw, 33vw"
          }
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold uppercase text-red-500">
          <span className="tracking-[0.08em] ">
            {competition?.name ?? "Apex League"}
          </span>
          <span className="text-slate-400">{formatDate(post.publishDate)}</span>
        </div>
        <h3 className="mt-2 text-base font-semibold leading-tight text-slate-950">
          {post.title}
        </h3>
        <p className="mt-2 text-sm leading-5 text-slate-600">{post.excerpt}</p>
      </div>
    </Link>
  );
}

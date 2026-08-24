import NewsCard from "./NewsCard";
import SectionHeader from "./SectionHeader";
import { type NewsPost } from "@/lib/league-data";

export default function News({ posts }: { posts: NewsPost[] }) {
  if (!posts.length) return null;

  return (
    <section className="space-y-3">
      <SectionHeader
        eyebrow="Tournament News"
        title="Headlines & Reports"
        actionHref="/news"
        actionLabel="All news"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 3).map((post, index) => (
          <NewsCard key={post.id} post={post} large={index === 0 && posts.length === 2} />
        ))}
      </div>
    </section>
  );
}

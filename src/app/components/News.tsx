import { newsPosts } from "@/lib/league-data";
import NewsCard from "./NewsCard";
import SectionHeader from "./SectionHeader";

const News = () => {
  return (
    <section className="space-y-3">
      <SectionHeader title="Latest News" actionHref="/news" actionLabel="All news" />
      <div className="grid gap-3 lg:grid-cols-3">
        {newsPosts.slice(0, 2).map((post, index) => (
          <NewsCard key={post.id} post={post} large={index === 0} />
        ))}
      </div>
    </section>
  );
};

export default News;

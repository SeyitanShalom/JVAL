import MatchCard from "./MatchCard";
import SectionHeader from "./SectionHeader";
import { type Match } from "@/lib/league-data";

export default function LiveMatches({ matches }: { matches: Match[] }) {
  if (!matches.length) return null;

  return (
    <section className="space-y-3">
      <SectionHeader
        eyebrow="Happening Now"
        title="Live Match Center"
        actionHref="/fixtures?status=live"
        actionLabel="All live"
      />
      <div className="grid gap-3 lg:grid-cols-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}

import MatchCard from "./MatchCard";
import SectionHeader from "./SectionHeader";
import { type Match } from "@/lib/league-data";

export default function FinishedMatches({ matches }: { matches: Match[] }) {
  if (!matches.length) return null;

  return (
    <section className="space-y-3">
      <SectionHeader
        eyebrow="Results"
        title="Latest Results"
        actionHref="/fixtures?status=finished"
        actionLabel="All results"
      />
      <div className="grid gap-3 lg:grid-cols-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} compact />
        ))}
      </div>
    </section>
  );
}

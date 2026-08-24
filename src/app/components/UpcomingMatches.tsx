import MatchCard from "./MatchCard";
import SectionHeader from "./SectionHeader";
import { type Match } from "@/lib/league-data";

export default function UpcomingMatches({ matches }: { matches: Match[] }) {
  if (!matches.length) return null;

  return (
    <section className="space-y-3">
      <SectionHeader
        eyebrow="On Deck"
        title="Upcoming Fixtures"
        actionHref="/fixtures?status=upcoming"
        actionLabel="All fixtures"
      />
      <div className="grid gap-3 lg:grid-cols-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} compact />
        ))}
      </div>
    </section>
  );
}

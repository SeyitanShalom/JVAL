import MatchCard from "./MatchCard";
import SectionHeader from "./SectionHeader";
import { matches } from "@/lib/league-data";

const LiveMatches = () => {
  const liveMatches = matches.filter((match) => match.status === "live");

  return (
    <section className="space-y-3">
      <SectionHeader title="Live Match" actionHref="/fixtures?status=live" actionLabel="Match center" />
      <div className="grid gap-3 lg:grid-cols-3">
        {liveMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
};

export default LiveMatches;

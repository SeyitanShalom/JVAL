import { matches } from "@/lib/league-data";
import MatchCard from "./MatchCard";
import SectionHeader from "./SectionHeader";

const FinishedMatches = () => {
  const finishedMatches = matches.filter((match) => match.status === "finished").slice(0, 3);

  return (
    <section className="space-y-3">
      <SectionHeader title="Latest Results" actionHref="/fixtures?status=finished" actionLabel="Results" />
      <div className="grid gap-3 lg:grid-cols-3">
        {finishedMatches.map((match) => (
          <MatchCard key={match.id} match={match} compact />
        ))}
      </div>
    </section>
  );
};

export default FinishedMatches;

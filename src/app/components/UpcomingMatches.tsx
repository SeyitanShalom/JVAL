import { matches } from "@/lib/league-data";
import MatchCard from "./MatchCard";
import SectionHeader from "./SectionHeader";

const UpcomingMatches = () => {
  const upcomingMatches = matches.filter((match) => match.status === "upcoming").slice(0, 3);

  return (
    <section className="space-y-3">
      <SectionHeader title="Upcoming Fixtures" actionHref="/fixtures?status=upcoming" actionLabel="Fixtures" />
      <div className="grid gap-3 lg:grid-cols-3">
        {upcomingMatches.map((match) => (
          <MatchCard key={match.id} match={match} compact />
        ))}
      </div>
    </section>
  );
};

export default UpcomingMatches;

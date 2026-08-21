import PlayerStatsCard from "./PlayerStatsCard";
import SectionHeader from "./SectionHeader";
import { getTopScorers } from "@/lib/league-data";

const PlayerStats = () => {
  const topScorers = getTopScorers(5);

  return (
    <section className="space-y-3">
      <SectionHeader title="Top Scorers" actionHref="/statistics" actionLabel="Full stats" />
      <div className="grid gap-2 md:grid-cols-2">
        {topScorers.map((player, index) => (
          <PlayerStatsCard key={player.id} player={player} rank={index + 1} metric="goals" />
        ))}
      </div>
    </section>
  );
};

export default PlayerStats;

import PlayerStatsCard from "./PlayerStatsCard";
import SectionHeader from "./SectionHeader";
import { type Player } from "@/lib/league-data";

export default function PlayerStats({ scorers }: { scorers: Player[] }) {
  if (!scorers.length) return null;

  return (
    <section className="space-y-3">
      <SectionHeader
        eyebrow="Individual Honours"
        title="Top Goalscorers"
        actionHref="/statistics"
        actionLabel="Full leaderboards"
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {scorers.slice(0, 6).map((player, index) => (
          <PlayerStatsCard key={player.id} player={player} rank={index + 1} metric="goals" />
        ))}
      </div>
    </section>
  );
}

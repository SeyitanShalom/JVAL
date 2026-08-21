import FilterSelect from "../components/FilterSelect";
import PlayerStatsCard from "../components/PlayerStatsCard";
import SectionHeader from "../components/SectionHeader";
import {
  competitions,
  getAssistLeaders,
  getCleanSheetLeaders,
  getTeamById,
  getTopScorers,
  seasons,
} from "@/lib/league-data";

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const selectedCompetition = query.competition ?? "all";

  const inCompetition = (teamId: string) => {
    const team = getTeamById(teamId);
    return selectedCompetition === "all" || team?.competitionIds.includes(selectedCompetition);
  };

  const scorers = getTopScorers().filter((player) => inCompetition(player.teamId));
  const assists = getAssistLeaders().filter((player) => inCompetition(player.teamId));
  const cleanSheets = getCleanSheetLeaders().filter((player) => inCompetition(player.teamId));

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Numbers"
        title="Statistics"
        description="Goals, assists, clean sheets, appearances, cards, and team performance across seasons and competitions."
      />

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <FilterSelect
          label="Season"
          name="season"
          value={query.season ?? seasons[0].id}
          options={seasons.map((season) => ({ value: season.id, label: season.label }))}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...competitions.map((competition) => ({ value: competition.id, label: competition.name })),
          ]}
        />
        <button className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-black text-white" type="submit">
          Apply
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <LeaderBoard title="Top Scorers" players={scorers} metric="goals" />
        <LeaderBoard title="Assists" players={assists} metric="assists" />
        <LeaderBoard title="Clean Sheets" players={cleanSheets} metric="cleanSheets" />
      </div>
    </section>
  );
}

function LeaderBoard({
  title,
  players,
  metric,
}: {
  title: string;
  players: ReturnType<typeof getTopScorers>;
  metric: "goals" | "assists" | "cleanSheets";
}) {
  return (
    <section className="space-y-3">
      <SectionHeader title={title} />
      <div className="space-y-2">
        {players.slice(0, 6).map((player, index) => (
          <PlayerStatsCard key={player.id} player={player} rank={index + 1} metric={metric} />
        ))}
      </div>
    </section>
  );
}

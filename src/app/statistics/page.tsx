import FilterSelect from "../components/FilterSelect";
import PlayerStatsCard from "../components/PlayerStatsCard";
import SectionHeader from "../components/SectionHeader";
import { getPublicStatisticsData } from "@/lib/public-data";
import { getTopScorers } from "@/lib/league-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const data = await getPublicStatisticsData(query);

  const selectedCompetition = query.competition ?? "all";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Numbers & Records"
        title="Statistics Hub"
        description="Goals, assists, clean sheets, and player performance metrics across competitions."
      />

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <FilterSelect
          label="Season"
          name="season"
          value={query.season ?? data.seasonsList[0].id}
          options={data.seasonsList.map((s) => ({
            value: s.id,
            label: s.label,
          }))}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...data.competitionsList.map((c) => ({
              value: c.id,
              label: c.name,
            })),
          ]}
        />
        <button
          className="h-10 rounded-lg bg-red-500 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-red-600"
          type="submit"
        >
          Apply Filter
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-3">
        <LeaderBoard
          title="⚽ Top Goalscorers"
          players={data.scorers}
          metric="goals"
        />
        <LeaderBoard
          title="🅰️ Playmakers (Assists)"
          players={data.assists}
          metric="assists"
        />
        <LeaderBoard
          title="🧤 Clean Sheet Leaders"
          players={data.cleanSheets}
          metric="cleanSheets"
        />
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
        {players.slice(0, 8).map((player, index) => (
          <PlayerStatsCard
            key={player.id}
            player={player}
            rank={index + 1}
            metric={metric}
          />
        ))}
        {players.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs font-semibold text-slate-400">
            No player stats recorded yet.
          </div>
        )}
      </div>
    </section>
  );
}

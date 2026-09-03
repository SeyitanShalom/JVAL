import CompactFilterForm from "../components/CompactFilterForm";
import FilterSelect from "../components/FilterSelect";
import PlayerStatsCard from "../components/PlayerStatsCard";
import SectionHeader from "../components/SectionHeader";
import {
  getPublicCompetitionFilterLabel,
  getPublicStatisticsData,
} from "@/lib/public-data";
import { type Player } from "@/lib/league-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StatFilter = "all" | "goals" | "assists" | "cleanSheets";

function isStatFilter(value?: string): value is StatFilter {
  return (
    value === "all" ||
    value === "goals" ||
    value === "assists" ||
    value === "cleanSheets"
  );
}

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{
    competition?: string;
    season?: string;
    stat?: string;
  }>;
}) {
  const query = await searchParams;
  const data = await getPublicStatisticsData(query);

  const selectedCompetition = query.competition ?? "all";
  const selectedSeason = query.season ?? data.seasonsList[0]?.id ?? "all";
  const selectedCompetitionRecord = data.competitionsList.find(
    (competition) =>
      competition.id === selectedCompetition ||
      competition.slug === selectedCompetition,
  );
  const isPendingSuperCupFilter =
    selectedCompetitionRecord?.type === "Super Cup" &&
    selectedCompetitionRecord.status === "upcoming";
  const selectedStat = isStatFilter(query.stat) ? query.stat : "all";
  const leaderboards = [
    {
      id: "goals",
      title: "Top Goalscorers",
      players: data.scorers,
      metric: "goals",
    },
    {
      id: "assists",
      title: "Playmakers (Assists)",
      players: data.assists,
      metric: "assists",
    },
    {
      id: "cleanSheets",
      title: "Clean Sheet Leaders",
      players: data.cleanSheets,
      metric: "cleanSheets",
    },
  ] as const;
  const visibleLeaderboards =
    selectedStat === "all"
      ? leaderboards
      : leaderboards.filter((leaderboard) => leaderboard.id === selectedStat);
  const resultCount =
    selectedStat === "all"
      ? leaderboards.length
      : visibleLeaderboards[0]?.players.length ?? 0;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Numbers & Records"
        title="Statistics Hub"
        description="Goals, assists, clean sheets, and player performance metrics across competitions."
      />

      <CompactFilterForm
        resultLabel={
          selectedStat === "all"
            ? `${resultCount} leaderboards`
            : `${resultCount} player${resultCount !== 1 ? "s" : ""}`
        }
        submitLabel="Apply Filter"
      >
        <FilterSelect
          label="Season"
          name="season"
          value={selectedSeason}
          options={[
            { value: "all", label: "All seasons" },
            ...data.seasonsList.map((s) => ({
              value: s.id,
              label: s.label,
            })),
          ]}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...data.competitionsList.map((c) => ({
              value: c.id,
              label: getPublicCompetitionFilterLabel(c),
            })),
          ]}
        />
        <FilterSelect
          label="Stat"
          name="stat"
          value={selectedStat}
          options={[
            { value: "all", label: "All leaderboards" },
            { value: "goals", label: "Goalscorers" },
            { value: "assists", label: "Assists" },
            { value: "cleanSheets", label: "Clean sheets" },
          ]}
        />
      </CompactFilterForm>

      {isPendingSuperCupFilter ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center text-sm font-semibold text-slate-500 shadow-sm">
          Super Cup statistics will appear once the competition becomes active.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {visibleLeaderboards.map((leaderboard) => (
            <LeaderBoard
              key={leaderboard.id}
              title={leaderboard.title}
              players={leaderboard.players}
              metric={leaderboard.metric}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function LeaderBoard({
  title,
  players,
  metric,
}: {
  title: string;
  players: Player[];
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

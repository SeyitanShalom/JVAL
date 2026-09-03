import { FiRefreshCw } from "react-icons/fi";
import { MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { getAdminStatisticsData } from "@/lib/admin-statistics";
import { recalculateStatsAction } from "./actions";
import type {
  CompetitionTable,
  PlayerLeaderboardRow,
} from "@/lib/admin-statistics";
import { requireAdminSession } from "@/lib/admin-auth";
import { hasAdminPermission } from "@/lib/admin-permissions";

export default async function AdminStatisticsPage({
  searchParams,
}: {
  searchParams?: Promise<{ recalculated?: string; error?: string }>;
}) {
  const [query, data, session] = await Promise.all([
    searchParams
      ? searchParams
      : Promise.resolve({} as { recalculated?: string; error?: string }),
    getAdminStatisticsData(),
    requireAdminSession(),
  ]);

  const {
    summary,
    tables,
    topScorers,
    assistLeaders,
    cleanSheetLeaders,
    yellowCardLeaders,
    redCardLeaders,
    teamGoalLeaders,
  } = data;
  const canWrite =
    data.databaseReady && hasAdminPermission(session.role, "manageStatistics");

  // Active / upcoming first, then completed
  const sortedTables = [...tables].sort((a, b) => {
    const order = { ACTIVE: 0, UPCOMING: 1, COMPLETED: 2 };
    return (
      (order[a.status as keyof typeof order] ?? 3) -
      (order[b.status as keyof typeof order] ?? 3)
    );
  });

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Calculated Data"
        title="Tables and statistics"
        description="Live league tables, player leaderboards, form, and qualification tracking — calculated automatically from match events."
        action={
          canWrite ? (
            <form action={recalculateStatsAction.bind(null, undefined)}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 h-10 text-xs font-bold text-white shadow-sm transition hover:bg-red-600 disabled:bg-slate-300"
              >
                <FiRefreshCw className="h-4 w-4" />
                Recalculate All Standings &amp; Stats
              </button>
            </form>
          ) : null
        }
      />

      {query?.recalculated && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          ✓ All league standings, points, goal differences, and player
          leaderboards recalculated successfully.
        </div>
      )}

      {query?.error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
          ⚠️ Could not recalculate statistics. Make sure database is connected.
        </div>
      )}

      {/* Source badge */}
      <div className="flex items-center gap-2">
        <AdminStatusBadge tone={data.source === "database" ? "green" : "slate"}>
          {data.source === "database" ? "Live database" : "Setup required"}
        </AdminStatusBadge>
        {data.error && (
          <span className="text-xs font-semibold text-amber-700">
            {data.error}
          </span>
        )}
      </div>

      {/* Summary metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Table teams"
          value={summary.totalTeams}
          detail="Across all competitions"
        />
        <MetricCard
          label="Top scorer"
          value={summary.topScorerGoals}
          detail={summary.topScorer}
        />
        <MetricCard
          label="Assist leader"
          value={summary.assistLeaderAssists}
          detail={summary.assistLeader}
        />
        <MetricCard
          label="Most clean sheets"
          value={summary.cleanSheetLeaderCount}
          detail={summary.cleanSheetLeader}
        />
      </section>

      {/* Main layout */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Competition Tables */}
        <section className="grid gap-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
            Competition Tables
          </h2>
          {sortedTables.map((table) => (
            <CompetitionTableCard key={table.competitionId} table={table} />
          ))}
          {sortedTables.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
              <p className="text-sm font-bold text-slate-500">
                No table data yet. Tables populate automatically once fixtures
                are recorded.
              </p>
            </div>
          )}
        </section>

        {/* Leaderboards sidebar */}
        <section className="grid gap-4 content-start">
          <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-slate-500">
            Leaderboards
          </h2>

          <Leaderboard
            title="⚽ Top scorers"
            unit="goals"
            rows={topScorers}
            accentColor="blue"
          />
          <Leaderboard
            title="🅰️ Assists"
            unit="assists"
            rows={assistLeaders}
            accentColor="indigo"
          />
          <Leaderboard
            title="🧤 Clean sheets"
            unit="clean sheets"
            rows={cleanSheetLeaders}
            accentColor="emerald"
          />
          <Leaderboard
            title="🟡 Yellow cards"
            unit="yellows"
            rows={yellowCardLeaders}
            accentColor="amber"
          />
          <Leaderboard
            title="🔴 Red cards"
            unit="reds"
            rows={redCardLeaders}
            accentColor="red"
          />
          <Leaderboard
            title="🥅 Team goals scored"
            unit="goals"
            rows={teamGoalLeaders}
            accentColor="violet"
            showTeamAsMeta={false}
          />
        </section>
      </div>
    </div>
  );
}

// ─── Competition table card ───────────────────────────────────────────────────

function CompetitionTableCard({ table }: { table: CompetitionTable }) {
  const tone =
    table.status === "ACTIVE" || table.status === "active"
      ? "green"
      : table.status === "COMPLETED" || table.status === "completed"
        ? "slate"
        : "amber";

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-slate-950">
            {table.competitionName}
          </h3>
          <p className="text-xs font-bold text-slate-400">
            {table.competitionType} · {table.rows.length} team
            {table.rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <AdminStatusBadge tone={tone}>{table.status}</AdminStatusBadge>
      </div>

      {/* Table rows */}
      {table.rows.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <div className="min-w-[30rem]">
              {/* Column headers */}
              <div className="grid grid-cols-[1.8rem_1fr_repeat(7,2.5rem)] gap-1 bg-slate-50 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                <span>#</span>
                <span>Team</span>
                <span className="text-center">P</span>
                <span className="text-center">W</span>
                <span className="text-center">D</span>
                <span className="text-center">L</span>
                <span className="text-center">GD</span>
                <span className="text-center">Pts</span>
                <span className="text-center">Form</span>
              </div>

              <div className="divide-y divide-slate-50">
                {table.rows.map((row) => (
                  <div
                    key={row.teamId}
                    className={`grid grid-cols-[1.8rem_1fr_repeat(7,2.5rem)] items-center gap-1 px-3 py-2.5 text-sm transition hover:bg-slate-50 ${
                      row.qualifiedForKnockout
                        ? "border-l-2 border-emerald-500"
                        : ""
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-400 tabular-nums">
                      {row.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-950">
                        {row.teamName}
                      </p>
                    </div>
                    <span className="text-center text-xs font-bold text-slate-600 tabular-nums">
                      {row.played}
                    </span>
                    <span className="text-center text-xs font-bold text-slate-600 tabular-nums">
                      {row.wins}
                    </span>
                    <span className="text-center text-xs font-bold text-slate-600 tabular-nums">
                      {row.draws}
                    </span>
                    <span className="text-center text-xs font-bold text-slate-600 tabular-nums">
                      {row.losses}
                    </span>
                    <span
                      className={`text-center text-xs font-bold tabular-nums ${row.goalDifference > 0 ? "text-emerald-700" : row.goalDifference < 0 ? "text-red-700" : "text-slate-500"}`}
                    >
                      {row.goalDifference > 0 ? "+" : ""}
                      {row.goalDifference}
                    </span>
                    <span className="text-center text-sm font-bold text-blue-700 tabular-nums">
                      {row.points}
                    </span>
                    <div className="flex justify-center gap-0.5">
                      {row.form ? (
                        row.form
                          .split("")
                          .slice(-5)
                          .map((result, i) => (
                            <span
                              key={i}
                              title={
                                result === "W"
                                  ? "Win"
                                  : result === "D"
                                    ? "Draw"
                                    : "Loss"
                              }
                              className={`inline-flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-bold text-white ${
                                result === "W"
                                  ? "bg-emerald-500"
                                  : result === "D"
                                    ? "bg-amber-400"
                                    : "bg-red-500"
                              }`}
                            >
                              {result}
                            </span>
                          ))
                      ) : (
                        <span className="text-[10px] text-slate-300">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Qualified indicator */}
          {table.rows.some((r) => r.qualifiedForKnockout) && (
            <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-2">
              <span className="inline-block h-3 w-0.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-slate-400">
                Qualified for knockout stage
              </span>
            </div>
          )}
        </>
      ) : (
        <p className="px-4 py-6 text-sm font-semibold text-slate-400">
          No standings yet — record match results to populate this table.
        </p>
      )}
    </article>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

const ACCENT: Record<string, string> = {
  blue: "text-blue-700",
  indigo: "text-indigo-700",
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-red-700",
  violet: "text-violet-700",
};

function Leaderboard({
  title,
  unit,
  rows,
  accentColor,
  showTeamAsMeta = true,
}: {
  title: string;
  unit: string;
  rows: PlayerLeaderboardRow[];
  accentColor: string;
  showTeamAsMeta?: boolean;
}) {
  const accent = ACCENT[accentColor] ?? "text-blue-700";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-3 py-3">
        <h3 className="text-sm font-bold text-slate-950">{title}</h3>
      </div>
      {rows.length > 0 ? (
        <div className="divide-y divide-slate-50">
          {rows.map((row) => (
            <div
              key={`${row.playerId}-${row.rank}`}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="w-5 shrink-0 text-right text-xs font-bold text-slate-300 tabular-nums">
                  {row.rank}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {row.playerName}
                  </p>
                  {showTeamAsMeta && (
                    <p className="text-xs font-bold text-slate-400">
                      {row.teamName}
                    </p>
                  )}
                  {!showTeamAsMeta && (
                    <p className="text-xs font-bold text-slate-400">
                      {row.teamName}
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-lg font-bold tabular-nums ${accent}`}>
                  {row.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  {unit}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-3 py-4 text-xs font-semibold text-slate-400">
          No data yet.
        </p>
      )}
    </div>
  );
}

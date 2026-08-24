import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import {
  competitions,
  getAssistLeaders,
  getCleanSheetLeaders,
  getTableRows,
  getTeamById,
  getTopScorers,
  teams,
} from "@/lib/league-data";

export default function AdminStatisticsPage() {
  const topScorers = getTopScorers(5);
  const assistLeaders = getAssistLeaders(5);
  const cleanSheetLeaders = getCleanSheetLeaders(5);
  const activeTables = competitions.map((competition) => ({
    competition,
    rows: getTableRows(competition.id),
  }));

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Calculated Data"
        title="Tables and statistics"
        description="Review calculated league tables, player statistics, team records, form, and knockout progress."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Table teams" value={teams.length} detail="Across sample data" />
        <MetricCard label="Top scorer" value={topScorers[0]?.goals ?? 0} detail={topScorers[0]?.name ?? "None"} />
        <MetricCard label="Assist leader" value={assistLeaders[0]?.assists ?? 0} detail={assistLeaders[0]?.name ?? "None"} />
        <MetricCard label="Clean sheets" value={cleanSheetLeaders[0]?.cleanSheets ?? 0} detail={cleanSheetLeaders[0]?.name ?? "None"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminPanel title="Competition Tables">
          <div className="grid gap-4">
            {activeTables.map(({ competition, rows }) => (
              <article key={competition.id} className="rounded-lg border border-slate-200">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-950">{competition.name}</h2>
                    <p className="text-xs font-bold text-slate-500">
                      Ranking: points, goal difference, goals scored, head-to-head
                    </p>
                  </div>
                  <AdminStatusBadge tone={rows.length ? "green" : "slate"}>{rows.length} rows</AdminStatusBadge>
                </div>
                {rows.length ? (
                  <div className="grid gap-2 p-3">
                    {rows.map((team, index) => (
                      <div key={team.id} className="min-w-0 rounded-lg bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-black text-slate-950">
                              {index + 1}. {team.name}
                            </p>
                            <p className="mt-1 text-xs font-bold text-slate-500">
                              Form: {team.form.join("") || "-"}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-black text-blue-700">{team.points}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Pts</p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs sm:grid-cols-7">
                          <TableStat label="P" value={team.played} />
                          <TableStat label="W" value={team.wins} />
                          <TableStat label="D" value={team.draws} />
                          <TableStat label="L" value={team.losses} />
                          <TableStat label="GF" value={team.goalsFor} />
                          <TableStat label="GA" value={team.goalsAgainst} />
                          <TableStat label="GD" value={team.goalsFor - team.goalsAgainst} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 text-sm font-semibold text-slate-500">No table rows yet.</p>
                )}
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Player Leaderboards">
          <div className="grid gap-4">
            <Leaderboard title="Top scorers" rows={topScorers.map((player) => ({ name: player.name, meta: getTeamById(player.teamId)?.shortName ?? "-", value: player.goals }))} />
            <Leaderboard title="Assists" rows={assistLeaders.map((player) => ({ name: player.name, meta: getTeamById(player.teamId)?.shortName ?? "-", value: player.assists }))} />
            <Leaderboard title="Clean sheets" rows={cleanSheetLeaders.map((player) => ({ name: player.name, meta: getTeamById(player.teamId)?.shortName ?? "-", value: player.cleanSheets }))} />
          </div>
        </AdminPanel>
      </section>
    </div>
  );
}

function TableStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded bg-white px-2 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}

function Leaderboard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ name: string; meta: string; value: number }>;
}) {
  return (
    <div className="rounded-lg border border-slate-200">
      <div className="border-b border-slate-100 px-3 py-2">
        <h2 className="text-sm font-black text-slate-950">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row, index) => (
          <div key={`${title}-${row.name}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <div>
              <p className="font-black text-slate-950">{index + 1}. {row.name}</p>
              <p className="text-xs font-bold text-slate-500">{row.meta}</p>
            </div>
            <p className="text-lg font-black text-blue-700">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

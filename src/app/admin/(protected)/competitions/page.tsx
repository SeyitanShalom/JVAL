import { FiPlus } from "react-icons/fi";
import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { tournamentRuleSummary } from "@/lib/admin-dashboard-data";
import { competitions, getTableRows, seasons } from "@/lib/league-data";

export default function AdminCompetitionsPage() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Tournament Setup"
        title="Competitions and seasons"
        description="Configure season editions, competition formats, pots, qualification paths, ranking rules, and knockout stages."
        action={
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white">
            <FiPlus aria-hidden="true" />
            Competition
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Seasons" value={seasons.length} detail="Archives included" />
        <MetricCard label="Competitions" value={competitions.length} detail="Current structure" />
        <MetricCard label="Total team slots" value={competitions.reduce((sum, competition) => sum + competition.plannedTeams, 0)} detail="Planned" />
        <MetricCard label="Default pots" value="4" detail="Configurable later" />
      </section>

      <AdminPanel title="Competition List">
        <div className="grid gap-3">
          {competitions.map((competition) => {
            const leader = getTableRows(competition.id)[0];

            return (
              <article key={competition.id} className="min-w-0 rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-base font-black text-slate-950">{competition.name}</p>
                    <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-500">{competition.description}</p>
                  </div>
                  <AdminStatusBadge tone={competition.status === "active" ? "green" : "slate"}>
                    {competition.status}
                  </AdminStatusBadge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:grid-cols-7">
                  <CompetitionMeta label="Type" value={competition.type} />
                  <CompetitionMeta label="Teams" value={competition.plannedTeams.toString()} />
                  <CompetitionMeta label="Pots" value={competition.potCount.toString()} />
                  <CompetitionMeta label="Qualify" value={competition.qualifiers.toString()} />
                  <CompetitionMeta label="Knockout" value={competition.knockoutStart} />
                  <CompetitionMeta label="Leader" value={leader?.name ?? "Not started"} wide />
                </div>
              </article>
            );
          })}
        </div>
      </AdminPanel>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <AdminPanel title="Season Editions">
          <div className="grid gap-3">
            {seasons.map((season) => (
              <div key={season.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="font-black text-slate-950">{season.label}</p>
                  <p className="text-xs font-bold text-slate-500">Archive: {season.id}</p>
                </div>
                <AdminStatusBadge tone={season.status === "active" ? "green" : "slate"}>{season.status}</AdminStatusBadge>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Format Defaults">
          <div className="grid gap-3 sm:grid-cols-2">
            {tournamentRuleSummary.map((rule) => (
              <div key={rule.label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{rule.label}</p>
                <p className="mt-1 text-sm font-black text-slate-950">{rule.value}</p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </section>
    </div>
  );
}

function CompetitionMeta({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-lg bg-slate-50 p-3 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

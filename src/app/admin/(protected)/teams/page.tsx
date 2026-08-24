import Image from "next/image";
import { FiPlus, FiUpload } from "react-icons/fi";
import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { competitions, getCompetitionById, getPlayersForTeam, teams } from "@/lib/league-data";

export default function AdminTeamsPage() {
  const assignedTeams = teams.filter((team) => team.competitionIds.length > 0);
  const squadCapacity = teams.length * 25;
  const registeredPlayers = teams.reduce((sum, team) => sum + getPlayersForTeam(team.id).length, 0);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Club Directory"
        title="Teams and squads"
        description="Manage team identity, logos, coaches, captains, competition entry, pot placement, and season squad limits."
        action={
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white">
            <FiPlus aria-hidden="true" />
            Team
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Teams" value={teams.length} detail="Registered" />
        <MetricCard label="Assigned" value={assignedTeams.length} detail="Competition entries" />
        <MetricCard label="Squad capacity" value={squadCapacity} detail="25 per team" />
        <MetricCard label="Players entered" value={registeredPlayers} detail="Sample squads" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel title="Team List">
          <div className="grid gap-3">
            {teams.map((team) => {
              const teamPlayers = getPlayersForTeam(team.id);

              return (
                <article key={team.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                      <Image src={team.logo} alt={`${team.name} logo`} width={42} height={42} className="h-10 w-10 object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-black text-slate-950">{team.name}</h2>
                        <AdminStatusBadge tone="blue">Pot {team.pot}</AdminStatusBadge>
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-500">{team.community}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-950">{teamPlayers.length}/25</p>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Squad</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                    <TeamMeta label="Coach" value={team.coach} />
                    <TeamMeta label="Captain" value={team.captain} />
                    <TeamMeta
                      label="Competition"
                      value={team.competitionIds.map((id) => getCompetitionById(id)?.name).filter(Boolean).join(", ") || "Unassigned"}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </AdminPanel>

        <AdminPanel title="Team Form">
          <form className="grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Team name
              <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Team name" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Short name
              <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold uppercase outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="ABC" maxLength={4} />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              City/community/LGA
              <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Akure South" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Coach
                <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Coach name" />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Captain
                <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Captain name" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Competition
              <select className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
                {competitions.map((competition) => (
                  <option key={competition.id}>{competition.name}</option>
                ))}
              </select>
            </label>
            <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-sm font-black text-slate-600">
              <FiUpload aria-hidden="true" />
              Upload logo
            </button>
          </form>
        </AdminPanel>
      </section>
    </div>
  );
}

function TeamMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-700">{value}</p>
    </div>
  );
}

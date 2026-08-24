import Image from "next/image";
import { FiPlus, FiUpload } from "react-icons/fi";
import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { calculateAge, getTeamById, players, teams } from "@/lib/league-data";

export default function AdminPlayersPage() {
  const goalkeepers = players.filter((player) => player.positionGroup === "Goalkeeper").length;
  const outfieldPlayers = players.length - goalkeepers;
  const topScorer = [...players].sort((a, b) => b.goals - a.goals)[0];

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Squad Registry"
        title="Players"
        description="Register player photos, squad numbers, position categories, detailed positions, teams, and dates of birth."
        action={
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white">
            <FiPlus aria-hidden="true" />
            Player
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Players" value={players.length} detail="Registered" />
        <MetricCard label="Goalkeepers" value={goalkeepers} detail="Position category" />
        <MetricCard label="Outfield" value={outfieldPlayers} detail="Def/Mid/Fwd" />
        <MetricCard label="Top scorer" value={topScorer?.goals ?? 0} detail={topScorer?.name ?? "None"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel title="Player List">
          <div className="grid gap-3">
            {players.map((player) => (
              <article key={player.id} className="min-w-0 rounded-lg border border-slate-200 p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Image src={player.photo} alt={player.name} width={44} height={44} className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="break-words font-black text-slate-950">{player.name}</p>
                      <AdminStatusBadge tone="blue">{player.detailedPosition}</AdminStatusBadge>
                    </div>
                    <p className="mt-1 break-all text-xs font-bold text-slate-500">{player.slug}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-black text-slate-950">{player.number}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">No.</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <PlayerMeta label="Team" value={getTeamById(player.teamId)?.name ?? "-"} />
                  <PlayerMeta label="Category" value={player.positionGroup} />
                  <PlayerMeta label="Age" value={calculateAge(player.dateOfBirth).toString()} />
                  <PlayerMeta label="Stats" value={`${player.goals} G, ${player.assists} A, ${player.cleanSheets} CS`} />
                </div>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Player Form">
          <form className="grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Full name
              <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Player full name" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Squad number
                <input type="number" min={1} max={99} className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="9" />
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Date of birth
                <input type="date" className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Position category
                <select className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
                  <option>Goalkeeper</option>
                  <option>Defender</option>
                  <option>Midfielder</option>
                  <option>Forward</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Detailed position
                <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold uppercase outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="ST" />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Team
              <select className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
                {teams.map((team) => (
                  <option key={team.id}>{team.name}</option>
                ))}
              </select>
            </label>
            <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-sm font-black text-slate-600">
              <FiUpload aria-hidden="true" />
              Upload photo
            </button>
          </form>
        </AdminPanel>
      </section>
    </div>
  );
}

function PlayerMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

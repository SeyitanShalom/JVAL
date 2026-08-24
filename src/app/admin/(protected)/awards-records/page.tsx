import { FiPlus } from "react-icons/fi";
import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { awardsRecords, competitions, getCompetitionById, seasons } from "@/lib/league-data";

export default function AdminAwardsRecordsPage() {
  const currentSeasonAwards = awardsRecords.filter((item) => item.seasonId === "2026-2027");

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Honours"
        title="Awards and records"
        description="Track awards and records per season, with optional competition, player, and team references."
        action={
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-black text-white">
            <FiPlus aria-hidden="true" />
            Entry
          </button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Entries" value={awardsRecords.length} detail="Awards and records" />
        <MetricCard label="Current season" value={currentSeasonAwards.length} detail="2026/2027" />
        <MetricCard label="Seasons" value={new Set(awardsRecords.map((item) => item.seasonId)).size} detail="Tracked" />
        <MetricCard label="Competitions" value={new Set(awardsRecords.map((item) => item.competitionId)).size} detail="Linked" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminPanel title="Awards and Records">
          <div className="grid gap-3">
            {awardsRecords.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">
                      {getCompetitionById(item.competitionId)?.name ?? "Season"}
                    </p>
                    <h2 className="mt-2 text-base font-black text-slate-950">{item.title}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-600">{item.winner}</p>
                  </div>
                  <AdminStatusBadge tone={item.seasonId === "2026-2027" ? "green" : "slate"}>{item.seasonId}</AdminStatusBadge>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-500">{item.detail}</p>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Entry Form">
          <form className="grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Title
              <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Golden Boot" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Winner/value
              <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Player, team, score, or record value" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Season
                <select className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
                  {seasons.map((season) => (
                    <option key={season.id}>{season.label}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-black text-slate-700">
                Type
                <select className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
                  <option>Award</option>
                  <option>Record</option>
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Competition
              <select className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
                <option>Season-wide</option>
                {competitions.map((competition) => (
                  <option key={competition.id}>{competition.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Detail
              <textarea className="min-h-28 rounded-lg border border-slate-200 px-3 py-3 font-semibold leading-6 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Award or record detail" />
            </label>
          </form>
        </AdminPanel>
      </section>
    </div>
  );
}

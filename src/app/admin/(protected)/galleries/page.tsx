import Image from "next/image";
import { FiUpload } from "react-icons/fi";
import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import {
  competitions,
  galleryItems,
  getCompetitionById,
  getMatchBySlug,
  getPlayerById,
  getTeamById,
  getVenueById,
  matches,
  players,
  seasons,
  teams,
  venues,
} from "@/lib/league-data";

const scopes = ["Season", "Competition", "Match", "Team", "Player", "Venue", "General"];

export default function AdminGalleriesPage() {
  const scopeCount = new Set(galleryItems.map((item) => item.scope)).size;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Media"
        title="Photo galleries"
        description="Upload and organize photos by season, competition, match, team, player, venue, or general site use."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Images" value={galleryItems.length} detail="Sample gallery" />
        <MetricCard label="Scopes used" value={scopeCount} detail="Flexible associations" />
        <MetricCard label="Matches" value={matches.length} detail="Can attach photos" />
        <MetricCard label="Cloudinary" value="Ready" detail="Upload fields mapped" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminPanel title="Gallery Images">
          <div className="grid gap-3 sm:grid-cols-2">
            {galleryItems.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200">
                <Image src={item.image} alt={item.title} width={420} height={260} className="h-44 w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-black text-slate-950">{item.title}</h2>
                    <AdminStatusBadge tone="blue">{item.scope}</AdminStatusBadge>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-500">
                    {item.competitionId ? getCompetitionById(item.competitionId)?.name : "General"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Upload Form">
          <form className="grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Title
              <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder="Gallery title" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Scope
              <select className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
                {scopes.map((scope) => (
                  <option key={scope}>{scope}</option>
                ))}
              </select>
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
                Competition
                <select className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
                  <option>None</option>
                  {competitions.map((competition) => (
                    <option key={competition.id}>{competition.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AssociationSelect label="Match" options={matches.map((match) => getMatchBySlug(match.slug)?.slug ?? match.slug)} />
              <AssociationSelect label="Team" options={teams.map((team) => getTeamById(team.id)?.name ?? team.name)} />
              <AssociationSelect label="Player" options={players.map((player) => getPlayerById(player.id)?.name ?? player.name)} />
              <AssociationSelect label="Venue" options={venues.map((venue) => getVenueById(venue.id)?.name ?? venue.name)} />
            </div>
            <button type="button" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 text-sm font-black text-slate-600">
              <FiUpload aria-hidden="true" />
              Upload image
            </button>
          </form>
        </AdminPanel>
      </section>
    </div>
  );
}

function AssociationSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      {label}
      <select className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
        <option>None</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

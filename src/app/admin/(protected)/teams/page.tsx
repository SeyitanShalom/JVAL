import Image from "next/image";
import { MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { getAdminTeamData } from "@/lib/admin-teams";
import { CreateTeamButton, EditTeamButton } from "./TeamModals";

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    error?: string;
  }>;
}) {
  const [query, teamData] = await Promise.all([searchParams, getAdminTeamData()]);
  const canWrite = teamData.databaseReady;
  const message = getPageMessage(query, teamData.error);

  const assignedCount = teamData.teams.filter((t) => t.competitionNames.length > 0).length;
  const squadCapacity = teamData.teams.length * 25;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Club Directory"
        title="Teams and squads"
        description="Manage team identity, logos, coaches, captains, competition entry, pot placement, and season squad limits."
        action={<CreateTeamButton canWrite={canWrite} />}
      />

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-bold ${
            message.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Teams"
          value={teamData.teams.length}
          detail={teamData.source === "database" ? "Database" : "Sample preview"}
        />
        <MetricCard label="Assigned" value={assignedCount} detail="Competition entries" />
        <MetricCard label="Squad capacity" value={squadCapacity} detail="25 per team" />
        <MetricCard
          label="Write mode"
          value={canWrite ? "On" : "Off"}
          detail={canWrite ? "Prisma connected" : "Needs Supabase env"}
        />
      </section>

      <div className="grid gap-3">
        {teamData.teams.length ? (
          teamData.teams.map((team) => (
            <article
              key={team.id}
              className="flex min-w-0 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              {/* Logo */}
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                <Image
                  src={team.logoUrl}
                  alt={`${team.name} logo`}
                  width={42}
                  height={42}
                  className="h-10 w-10 object-contain"
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-950">{team.name}</h2>
                  <AdminStatusBadge tone="blue">{team.shortName}</AdminStatusBadge>
                </div>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-500">{team.community}</p>
                {team.competitionNames.length > 0 && (
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                    {team.competitionNames.join(" · ")}
                  </p>
                )}
              </div>

              {/* Meta */}
              <div className="hidden shrink-0 flex-col items-end sm:flex">
                <p className="text-sm font-semibold text-slate-500">{team.coachName}</p>
                <p className="text-xs text-slate-400">Coach</p>
              </div>

              {/* Squad count */}
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-slate-950">
                  {team.squadCount}/{team.squadLimit}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Squad</p>
              </div>

              {/* Edit trigger */}
              <EditTeamButton team={team} canWrite={canWrite} />
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-sm font-bold text-slate-500">
              No teams yet.{" "}
              <span className="text-blue-600">Click "+ Team" above to add the first one.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getPageMessage(
  query: { created?: string; updated?: string; error?: string },
  fallbackError?: string
) {
  if (query.created) return { tone: "success" as const, text: "Team created successfully." };
  if (query.updated) return { tone: "success" as const, text: "Team updated successfully." };
  if (query.error === "missing") return { tone: "warning" as const, text: "Team name, short name, and community are required." };
  if (query.error === "database") return { tone: "warning" as const, text: "Database is not connected. Add Supabase env values before saving." };
  if (query.error === "save") return { tone: "warning" as const, text: "Team could not be saved. Check the database connection." };
  if (query.error === "no-season") return { tone: "warning" as const, text: "No active season found. Please seed the database first." };
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}

import Image from "next/image";
import Link from "next/link";
import { FiFilter } from "react-icons/fi";
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
    competition?: string;
    community?: string;
  }>;
}) {
  const [query, teamData] = await Promise.all([
    searchParams,
    getAdminTeamData(),
  ]);
  const canWrite = teamData.databaseReady;
  const message = getPageMessage(query, teamData.error);

  const assignedCount = teamData.teams.filter(
    (t) => t.competitionNames.length > 0,
  ).length;
  const squadCapacity = teamData.teams.length * 25;
  const selectedCompetition = query.competition ?? "all";
  const selectedCommunity = query.community ?? "all";
  const communityOptions = Array.from(
    new Set(teamData.teams.map((team) => team.community).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
  const visibleTeams = teamData.teams.filter((team) => {
    const matchesCompetition =
      selectedCompetition === "all" ||
      team.competitionIds.includes(selectedCompetition);
    const matchesCommunity =
      selectedCommunity === "all" || team.community === selectedCommunity;

    return matchesCompetition && matchesCommunity;
  });
  const hasActiveFilters =
    selectedCompetition !== "all" || selectedCommunity !== "all";

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Club Directory"
        title="Teams and squads"
        description="Manage team identity, logos, coaches, captains, competition entry, pot placement, and season squad limits."
        action={
          <CreateTeamButton
            canWrite={canWrite}
            competitionOptions={teamData.competitionOptions}
          />
        }
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
          detail={
            teamData.source === "database" ? "Database" : "Setup required"
          }
        />
        <MetricCard
          label="Assigned"
          value={assignedCount}
          detail="Competition entries"
        />
        <MetricCard
          label="Squad capacity"
          value={squadCapacity}
          detail="25 per team"
        />
        <MetricCard
          label="Write mode"
          value={canWrite ? "On" : "Off"}
          detail={canWrite ? "Prisma connected" : "Needs Supabase env"}
        />
      </section>

      <form
        action="/admin/teams"
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
            <AdminFilterSelect
              label="Competition"
              name="competition"
              value={selectedCompetition}
              options={[
                { value: "all", label: "All competitions" },
                ...teamData.competitionOptions.map((competition) => ({
                  value: competition.id,
                  label: competition.name,
                })),
              ]}
            />
            <AdminFilterSelect
              label="Community"
              name="community"
              value={selectedCommunity}
              options={[
                { value: "all", label: "All communities" },
                ...communityOptions.map((community) => ({
                  value: community,
                  label: community,
                })),
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              Showing {visibleTeams.length} of {teamData.teams.length}
            </span>
            {hasActiveFilters ? (
              <Link
                href="/admin/teams"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Reset
              </Link>
            ) : null}
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-red-500"
            >
              <FiFilter aria-hidden="true" />
              Filter
            </button>
          </div>
        </div>
      </form>

      <div className="grid gap-3">
        {visibleTeams.length ? (
          visibleTeams.map((team) => (
            <article
              key={team.id}
              className="rounded-lg border border-slate-200 bg-white p-3 sm:flex sm:min-w-0 sm:items-center sm:gap-4 sm:p-4"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-50 sm:h-14 sm:w-14">
                  <Image
                    src={team.logoUrl}
                    alt={`${team.name} logo`}
                    width={42}
                    height={42}
                    className="h-9 w-9 object-contain sm:h-10 sm:w-10"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words text-sm font-bold text-slate-950 sm:text-base">
                      {team.name}
                    </h2>
                    <AdminStatusBadge tone="blue">
                      {team.shortName}
                    </AdminStatusBadge>
                  </div>
                  <p className="mt-0.5 break-words text-xs font-semibold text-slate-500 sm:text-sm">
                    {team.community}
                  </p>
                  {team.competitionNames.length > 0 && (
                    <p className="mt-0.5 break-words text-xs font-semibold text-slate-400">
                      {team.competitionNames.join(" - ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:mt-0 sm:border-t-0 sm:pt-0">
                <div className="hidden shrink-0 flex-col items-end md:flex">
                  <p className="max-w-[10rem] truncate text-sm font-semibold text-slate-500">
                    {team.managerName || "No manager"}
                  </p>
                  <p className="text-xs text-slate-400">Manager</p>
                  <p className="mt-2 max-w-[10rem] truncate text-sm font-semibold text-slate-500">
                    {team.coachName}
                  </p>
                  <p className="text-xs text-slate-400">Coach 1</p>
                  {team.coachTwoName ? (
                    <>
                      <p className="mt-2 max-w-[10rem] truncate text-sm font-semibold text-slate-500">
                        {team.coachTwoName}
                      </p>
                      <p className="text-xs text-slate-400">Coach 2</p>
                    </>
                  ) : null}
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-base font-bold text-slate-950 sm:text-lg">
                    {team.squadCount}/{team.squadLimit}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Squad
                  </p>
                </div>

                <EditTeamButton
                  team={team}
                  canWrite={canWrite}
                  competitionOptions={teamData.competitionOptions}
                />
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-sm font-bold text-slate-500">
              {teamData.teams.length
                ? "No teams match the selected filters."
                : "No teams yet."}{" "}
              {!teamData.teams.length ? (
                <span className="text-red-500">
                  Click &quot;+ Team&quot; above to add the first one.
                </span>
              ) : null}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminFilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-xs font-bold text-slate-600">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function getPageMessage(
  query: {
    created?: string;
    updated?: string;
    error?: string;
    competition?: string;
    community?: string;
  },
  fallbackError?: string,
) {
  if (query.created)
    return { tone: "success" as const, text: "Team created successfully." };
  if (query.updated)
    return { tone: "success" as const, text: "Team updated successfully." };
  if (query.error === "missing")
    return {
      tone: "warning" as const,
      text: "Team name, short name, and community are required.",
    };
  if (query.error === "database")
    return {
      tone: "warning" as const,
      text: "Database is not connected. Add Supabase env values before saving.",
    };
  if (query.error === "save")
    return {
      tone: "warning" as const,
      text: "Team could not be saved. Check the database connection.",
    };
  if (query.error === "no-season")
    return {
      tone: "warning" as const,
      text: "No active season found. Create or activate a season first.",
    };
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}

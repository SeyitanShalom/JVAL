import Image from "next/image";
import Link from "next/link";
import { FiFilter } from "react-icons/fi";
import { MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import { getAdminPlayerData } from "@/lib/admin-players";
import { CreatePlayerButton, EditPlayerButton } from "./PlayerModals";

export default async function AdminPlayersPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    error?: string;
    team?: string;
    competition?: string;
  }>;
}) {
  const [query, playerData] = await Promise.all([
    searchParams,
    getAdminPlayerData(),
  ]);
  const canWrite = playerData.databaseReady;
  const message = getPageMessage(query, playerData.error);
  const selectedTeam = query.team ?? "all";
  const selectedCompetition = query.competition ?? "all";
  const visiblePlayers = playerData.players.filter((player) => {
    const matchesTeam = selectedTeam === "all" || player.teamId === selectedTeam;
    const matchesCompetition =
      selectedCompetition === "all" ||
      player.competitionIds.includes(selectedCompetition);

    return matchesTeam && matchesCompetition;
  });
  const hasActiveFilters =
    selectedTeam !== "all" || selectedCompetition !== "all";

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Squad Registry"
        title="Players"
        description="Register player photos, squad numbers, position categories, detailed positions, teams, and dates of birth."
        action={
          <CreatePlayerButton
            canWrite={canWrite}
            teamOptions={playerData.teamOptions}
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
          label="Players"
          value={playerData.players.length}
          detail={
            playerData.source === "database" ? "Database" : "Setup required"
          }
        />
        <MetricCard
          label="Goalkeepers"
          value={playerData.goalkeeperCount}
          detail="Position category"
        />
        <MetricCard
          label="Outfield"
          value={playerData.outfieldCount}
          detail="Def/Mid/Fwd"
        />
        <MetricCard
          label="Write mode"
          value={canWrite ? "On" : "Off"}
          detail={canWrite ? "Prisma connected" : "Needs Supabase env"}
        />
      </section>

      <form
        action="/admin/players"
        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
            <AdminFilterSelect
              label="Team"
              name="team"
              value={selectedTeam}
              options={[
                { value: "all", label: "All teams" },
                ...playerData.teamOptions.map((team) => ({
                  value: team.id,
                  label: team.name,
                })),
              ]}
            />
            <AdminFilterSelect
              label="Competition"
              name="competition"
              value={selectedCompetition}
              options={[
                { value: "all", label: "All competitions" },
                ...playerData.competitionOptions.map((competition) => ({
                  value: competition.id,
                  label: competition.name,
                })),
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              Showing {visiblePlayers.length} of {playerData.players.length}
            </span>
            {hasActiveFilters ? (
              <Link
                href="/admin/players"
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
        {visiblePlayers.length ? (
          visiblePlayers.map((player) => (
            <article
              key={`${player.id}-${player.teamSeasonId}`}
              className="flex min-w-0 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
            >
              {/* Photo */}
              <Image
                src={player.photoUrl}
                alt={player.fullName}
                width={44}
                height={44}
                className="h-12 w-12 shrink-0 rounded-xl object-cover"
              />

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-950">{player.fullName}</p>
                  <AdminStatusBadge tone="blue">
                    {player.detailedPosition}
                  </AdminStatusBadge>
                </div>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-500">
                  {player.teamName}
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-400">
                  {player.positionCategory} · DOB {player.dateOfBirth}
                </p>
              </div>

              {/* Squad number */}
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-slate-950">
                  #{player.squadNumber}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  No.
                </p>
              </div>

              {/* Edit trigger */}
              <EditPlayerButton player={player} canWrite={canWrite} />
            </article>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-sm font-bold text-slate-500">
              {playerData.players.length
                ? "No players match the selected filters."
                : "No players registered yet."}{" "}
              {!playerData.players.length ? (
                <span className="text-red-500">
                  Click &quot;+ Player&quot; above to register the first one.
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
    team?: string;
    competition?: string;
  },
  fallbackError?: string,
) {
  if (query.created)
    return {
      tone: "success" as const,
      text: "Player registered successfully.",
    };
  if (query.updated)
    return { tone: "success" as const, text: "Player updated successfully." };
  if (query.error === "missing")
    return {
      tone: "warning" as const,
      text: "All required fields must be filled.",
    };
  if (query.error === "database")
    return {
      tone: "warning" as const,
      text: "Database is not connected. Add Supabase env values before saving.",
    };
  if (query.error === "save")
    return {
      tone: "warning" as const,
      text: "Player could not be saved. Check the database connection.",
    };
  if (query.error === "no-team")
    return {
      tone: "warning" as const,
      text: "Selected team not found. Create a team before registering players.",
    };
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}

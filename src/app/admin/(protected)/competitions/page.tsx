import { MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminStatusBadge from "../../components/AdminStatusBadge";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "../../components/AdminModalButtons";
import TournamentDrawModal from "../../components/TournamentDrawModal";
import { getAdminCompetitionData } from "@/lib/admin-competitions";
import {
  createCompetition,
  createSeason,
  deleteCompetition,
  deleteSeason,
  updateCompetition,
  updateSeason,
} from "./actions";
import { tournamentRuleSummary } from "@/lib/admin-dashboard-data";
import { requireAdminSession } from "@/lib/admin-auth";
import { hasAdminPermission } from "@/lib/admin-permissions";

export default async function AdminCompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const [query, data, session] = await Promise.all([
    searchParams,
    getAdminCompetitionData(),
    requireAdminSession(),
  ]);
  const canWrite = data.databaseReady;
  const canManageStructure =
    canWrite && hasAdminPermission(session.role, "manageTournamentStructure");
  const canDeleteCritical =
    canWrite && hasAdminPermission(session.role, "deleteCriticalData");
  const message = getPageMessage(query, data.error);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Tournament Setup"
        title="Competitions and seasons"
        description="Configure season editions, competition formats, pots, qualification paths, ranking rules, and knockout stages."
        action={
          canManageStructure ? (
            <div className="flex flex-wrap items-center gap-2">
            <TournamentDrawModal
              competitions={data.competitions.map((c) => ({
                id: c.id,
                name: c.name,
                type: c.type,
                plannedTeams: c.plannedTeams,
                potCount: c.potCount,
                opponentsPerPot: c.opponentsPerPot,
                includeOwnPotOpponents: c.includeOwnPotOpponents,
              }))}
              canWrite={canManageStructure}
            />
            <AddButton
              label="Competition"
              title="Create Competition"
              description="Add a new competition to the current season."
            >
              <CompetitionForm
                action={createCompetition}
                canWrite={canManageStructure}
                seasonOptions={data.seasons}
                currentSeasonId={data.currentSeasonId}
              />
            </AddButton>
          </div>
          ) : null
        }
      />

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-semibold ${message.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Seasons"
          value={data.seasons.length}
          detail={data.source === "database" ? "Database" : "Setup required"}
        />
        <MetricCard
          label="Competitions"
          value={data.competitions.length}
          detail="All seasons"
        />
        <MetricCard
          label="Total team slots"
          value={data.competitions.reduce((s, c) => s + c.plannedTeams, 0)}
          detail="Planned"
        />
        <MetricCard
          label="Write mode"
          value={canWrite ? "On" : "Off"}
          detail={canWrite ? "Prisma connected" : "Needs Supabase env"}
        />
      </section>

      {/* Competition cards */}
      <div className="grid gap-3">
        {data.competitions.map((competition) => (
          <article
            key={competition.id}
            className="min-w-0 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-words text-base font-bold text-slate-950">
                  {competition.name}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {competition.seasonLabel} · {competition.teamCount} team
                  {competition.teamCount !== 1 ? "s" : ""} registered
                </p>
                <p className="mt-0.5 max-w-2xl break-words text-xs font-semibold leading-5 text-slate-400">
                  {competition.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <AdminStatusBadge
                  tone={
                    competition.status === "ACTIVE" ||
                    competition.status === "active"
                      ? "green"
                      : "slate"
                  }
                >
                  {competition.status}
                </AdminStatusBadge>
                {canManageStructure ? (
                  <EditButton title={`Edit — ${competition.name}`} compact>
                    <CompetitionEditForm
                      competition={competition}
                      action={updateCompetition.bind(null, competition.id)}
                      canWrite={canManageStructure}
                    />
                  </EditButton>
                ) : null}
                {canDeleteCritical ? (
                  <DeleteButton
                    title="Delete Competition"
                    itemLabel={competition.name}
                    action={deleteCompetition.bind(null, competition.id)}
                    disabled={competition.teamCount > 0}
                    disabledReason={
                      competition.teamCount > 0
                        ? "Has registered teams — remove them first"
                        : undefined
                    }
                  />
                ) : null}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
              <CompetitionMeta label="Type" value={competition.type} />
              <CompetitionMeta
                label="Planned teams"
                value={competition.plannedTeams.toString()}
              />
              <CompetitionMeta
                label="Pots"
                value={competition.potCount.toString()}
              />
              <CompetitionMeta
                label="Opp/pot"
                value={competition.opponentsPerPot.toString()}
              />
              <CompetitionMeta
                label="Own pot"
                value={competition.includeOwnPotOpponents ? "Yes" : "No"}
              />
              <CompetitionMeta
                label="Qualifiers"
                value={competition.qualifiers.toString()}
              />
              <CompetitionMeta
                label="Knockout from"
                value={competition.knockoutStart}
              />
            </div>
          </article>
        ))}
        {data.competitions.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center">
            <p className="text-sm font-bold text-slate-500">
              No competitions yet.{" "}
              <span className="text-red-500">
                Click &quot;+ Competition&quot; above.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Seasons + format rules */}
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-950">
              Season Editions
            </h2>
            {canManageStructure ? (
              <AddButton
                label="Season"
                title="Add Season"
                description="Create a new season archive."
              >
                <SeasonForm
                  action={createSeason}
                  canWrite={canManageStructure}
                />
              </AddButton>
            ) : null}
          </div>
          <div className="grid gap-3 p-4">
            {data.seasons.map((season) => (
              <div
                key={season.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
              >
                <div>
                  <p className="font-bold text-slate-950">{season.label}</p>
                  <p className="text-xs font-bold text-slate-400">
                    {season.competitionCount} competition
                    {season.competitionCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AdminStatusBadge tone={season.isCurrent ? "green" : "slate"}>
                    {season.status}
                  </AdminStatusBadge>
                  {canManageStructure ? (
                    <EditButton title={`Edit Season — ${season.label}`} compact>
                      <SeasonEditForm
                        season={season}
                        action={updateSeason.bind(null, season.id)}
                        canWrite={canManageStructure}
                      />
                    </EditButton>
                  ) : null}
                  {canDeleteCritical ? (
                    <DeleteButton
                      title="Delete Season"
                      itemLabel={season.label}
                      action={deleteSeason.bind(null, season.id)}
                      disabled={season.competitionCount > 0}
                      disabledReason={
                        season.competitionCount > 0
                          ? "Has competitions — remove them first"
                          : undefined
                      }
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-950">
              Format Defaults
            </h2>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {tournamentRuleSummary.map((rule) => (
              <div key={rule.label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {rule.label}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {rule.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CompetitionForm({
  action,
  canWrite,
  seasonOptions,
  currentSeasonId,
}: {
  action: (fd: FormData) => Promise<void>;
  canWrite: boolean;
  seasonOptions: { id: string; label: string }[];
  currentSeasonId: string | null;
}) {
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Name
        <input
          name="name"
          disabled={!canWrite}
          className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
          placeholder="e.g. Regional League"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Season
        <select
          name="seasonId"
          defaultValue={currentSeasonId ?? undefined}
          disabled={!canWrite || seasonOptions.length === 0}
          className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
        >
          {seasonOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Type
          <select
            name="type"
            disabled={!canWrite}
            className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
          >
            <option value="LGA">LGA</option>
            <option value="STATE">STATE</option>
            <option value="SUPER_CUP">SUPER CUP</option>
            <option value="CUSTOM">CUSTOM</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Planned teams
          <input
            name="plannedTeams"
            type="number"
            min={2}
            disabled={!canWrite}
            className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
            placeholder="28"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Pots
          <input
            name="potCount"
            type="number"
            min={1}
            defaultValue={4}
            disabled={!canWrite}
            className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Opponents per pot
          <input
            name="opponentsPerPot"
            type="number"
            min={1}
            defaultValue={1}
            disabled={!canWrite}
            className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700">
          <input
            name="includeOwnPotOpponents"
            type="checkbox"
            defaultChecked
            disabled={!canWrite}
            className="h-4 w-4 rounded border-slate-300 text-red-500 focus:ring-red-500 disabled:opacity-60"
          />
          Include own-pot opponents
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Qualifiers
          <input
            name="qualifiers"
            type="number"
            min={1}
            defaultValue={8}
            disabled={!canWrite}
            className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
          />
        </label>
      </div>
      {!canWrite && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Connect Supabase in <code>.env</code> to enable writes.
        </p>
      )}
      <button
        type="submit"
        disabled={!canWrite}
        className="h-10 rounded-lg bg-red-500 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Create competition
      </button>
    </form>
  );
}

function CompetitionEditForm({
  competition,
  action,
  canWrite,
}: {
  competition: {
    name: string;
    plannedTeams: number;
    potCount: number;
    opponentsPerPot: number;
    includeOwnPotOpponents: boolean;
    qualifiers: number;
    status: string;
  };
  action: (fd: FormData) => Promise<void>;
  canWrite: boolean;
}) {
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Name
        <input
          name="name"
          defaultValue={competition.name}
          disabled={!canWrite}
          className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Status
        <select
          name="status"
          defaultValue={competition.status}
          disabled={!canWrite}
          className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
        >
          <option value="UPCOMING">Upcoming</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Teams
          <input
            name="plannedTeams"
            type="number"
            min={2}
            defaultValue={competition.plannedTeams}
            disabled={!canWrite}
            className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Pots
          <input
            name="potCount"
            type="number"
            min={1}
            defaultValue={competition.potCount}
            disabled={!canWrite}
            className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Opponents per pot
          <input
            name="opponentsPerPot"
            type="number"
            min={1}
            defaultValue={competition.opponentsPerPot}
            disabled={!canWrite}
            className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Qualifiers
          <input
            name="qualifiers"
            type="number"
            min={1}
            defaultValue={competition.qualifiers}
            disabled={!canWrite}
            className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
          />
        </label>
      </div>
      <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700">
        <input
          name="includeOwnPotOpponents"
          type="checkbox"
          defaultChecked={competition.includeOwnPotOpponents}
          disabled={!canWrite}
          className="h-4 w-4 rounded border-slate-300 text-red-500 focus:ring-red-500 disabled:opacity-60"
        />
        Include own-pot opponents
      </label>
      {!canWrite && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Connect Supabase to enable writes.
        </p>
      )}
      <button
        type="submit"
        disabled={!canWrite}
        className="h-10 rounded-lg bg-blue-700 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Save changes
      </button>
    </form>
  );
}

function SeasonForm({
  action,
  canWrite,
}: {
  action: (fd: FormData) => Promise<void>;
  canWrite: boolean;
}) {
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Label
        <input
          name="label"
          disabled={!canWrite}
          className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100"
          placeholder="2027/2028"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Status
        <select
          name="status"
          disabled={!canWrite}
          className="h-9 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-red-500 disabled:bg-slate-100"
        >
          <option value="UPCOMING">Upcoming</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </label>
      {!canWrite && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Connect Supabase to enable writes.
        </p>
      )}
      <button
        type="submit"
        disabled={!canWrite}
        className="h-10 rounded-lg bg-red-500 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Create season
      </button>
    </form>
  );
}

function SeasonEditForm({
  season,
  action,
  canWrite,
}: {
  season: { label: string; status: string };
  action: (fd: FormData) => Promise<void>;
  canWrite: boolean;
}) {
  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Label
        <input
          name="label"
          defaultValue={season.label}
          disabled={!canWrite}
          className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Status
        <select
          name="status"
          defaultValue={season.status}
          disabled={!canWrite}
          className="h-10 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
        >
          <option value="UPCOMING">Upcoming</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </label>
      {!canWrite && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Connect Supabase to enable writes.
        </p>
      )}
      <button
        type="submit"
        disabled={!canWrite}
        className="h-10 rounded-lg bg-blue-700 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Save changes
      </button>
    </form>
  );
}

function CompetitionMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function getPageMessage(
  query: {
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  },
  fallbackError?: string,
) {
  if (query.created)
    return { tone: "success" as const, text: "Created successfully." };
  if (query.updated)
    return { tone: "success" as const, text: "Updated successfully." };
  if (query.deleted)
    return { tone: "success" as const, text: "Deleted successfully." };
  if (query.error === "missing")
    return { tone: "warning" as const, text: "Required fields are missing." };
  if (query.error === "database")
    return {
      tone: "warning" as const,
      text: "Database not connected. Add Supabase env values.",
    };
  if (query.error === "save")
    return {
      tone: "warning" as const,
      text: "Could not save. Check DB connection.",
    };
  if (query.error === "delete")
    return {
      tone: "warning" as const,
      text: "Could not delete — it may have dependent records.",
    };
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}

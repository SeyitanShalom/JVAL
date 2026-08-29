import Image from "next/image";
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
  }>;
}) {
  const [query, playerData] = await Promise.all([
    searchParams,
    getAdminPlayerData(),
  ]);
  const canWrite = playerData.databaseReady;
  const message = getPageMessage(query, playerData.error);

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
            playerData.source === "database" ? "Database" : "Sample preview"
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

      <div className="grid gap-3">
        {playerData.players.length ? (
          playerData.players.map((player) => (
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
              No players registered yet.{" "}
              <span className="text-red-500">
                Click &quot;+ Player&quot; above to register the first one.
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getPageMessage(
  query: { created?: string; updated?: string; error?: string },
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
      text: "Selected team not found. Make sure teams are seeded first.",
    };
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}

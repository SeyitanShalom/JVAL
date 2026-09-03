import Image from "next/image";
import Link from "next/link";
import CompactFilterForm from "../components/CompactFilterForm";
import FilterSelect from "../components/FilterSelect";
import SectionHeader from "../components/SectionHeader";
import { calculateAge, getTeamById } from "@/lib/league-data";
import {
  getPublicCompetitionFilterLabel,
  getPublicPlayersData,
} from "@/lib/public-data";

const positionOptions = [
  { value: "all", label: "All positions" },
  { value: "Goalkeeper", label: "Goalkeepers" },
  { value: "Defender", label: "Defenders" },
  { value: "Midfielder", label: "Midfielders" },
  { value: "Forward", label: "Forwards" },
];

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{
    season?: string;
    competition?: string;
    team?: string;
    position?: string;
  }>;
}) {
  const query = await searchParams;
  const data = await getPublicPlayersData(query);

  const selectedCompetition = query.competition ?? "all";
  const selectedSeason = query.season ?? data.seasonsList[0]?.id ?? "all";
  const selectedTeam = query.team ?? "all";
  const selectedPosition = query.position ?? "all";
  const selectedCompetitionRecord = data.competitionsList.find(
    (competition) =>
      competition.id === selectedCompetition ||
      competition.slug === selectedCompetition,
  );
  const isPendingSuperCupFilter =
    selectedCompetitionRecord?.type === "Super Cup" &&
    selectedCompetitionRecord.status === "upcoming";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Squad Registry"
        title="Players"
        description="Player records, squad numbers, positions, and live tournament statistics."
      />

      <CompactFilterForm
        resultLabel={`${data.players.length} player${data.players.length !== 1 ? "s" : ""}`}
        submitLabel="Apply Filter"
      >
        <FilterSelect
          label="Season"
          name="season"
          value={selectedSeason}
          options={[
            { value: "all", label: "All seasons" },
            ...data.seasonsList.map((s) => ({
              value: s.id,
              label: s.label,
            })),
          ]}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...data.competitionsList.map((c) => ({
              value: c.id,
              label: getPublicCompetitionFilterLabel(c),
            })),
          ]}
        />
        <FilterSelect
          label="Team"
          name="team"
          value={selectedTeam}
          options={[
            { value: "all", label: "All teams" },
            ...data.teamsList.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />
        <FilterSelect
          label="Position"
          name="position"
          value={selectedPosition}
          options={positionOptions}
        />
      </CompactFilterForm>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.players.map((player) => {
          const team = getTeamById(player.teamId);

          return (
            <Link
              key={player.id}
              href={`/players/${player.slug}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-500 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={player.photo}
                  alt={`${player.name} photo`}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-950 group-hover:text-red-500 transition">
                    #{player.number} {player.name}
                  </p>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {team?.name}
                  </p>
                  <p className="text-[11px] font-bold text-red-500">
                    {player.detailedPosition} · Age{" "}
                    {calculateAge(player.dateOfBirth)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat
                  label="Goals"
                  value={player.goals.toString()}
                  highlight={player.goals > 0}
                />
                <Stat label="Assists" value={player.assists.toString()} />
                <Stat label="Apps" value={player.appearances.toString()} />
              </div>
            </Link>
          );
        })}
        {data.players.length === 0 && (
          <div className="col-span-full rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-sm font-bold text-slate-500">
              {isPendingSuperCupFilter
                ? "Super Cup players will appear once the competition becomes active."
                : "No players match the selected filter."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-0.5 text-base font-bold ${highlight ? "text-red-500" : "text-slate-950"}`}
      >
        {value}
      </p>
    </div>
  );
}

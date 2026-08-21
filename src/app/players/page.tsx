import Image from "next/image";
import Link from "next/link";
import FilterSelect from "../components/FilterSelect";
import SectionHeader from "../components/SectionHeader";
import { calculateAge, competitions, getTeamById, players, seasons, teams } from "@/lib/league-data";

const positionOptions = [
  { value: "all", label: "All positions" },
  { value: "Goalkeeper", label: "Goalkeeper" },
  { value: "Defender", label: "Defender" },
  { value: "Midfielder", label: "Midfielder" },
  { value: "Forward", label: "Forward" },
];

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; competition?: string; team?: string; position?: string }>;
}) {
  const query = await searchParams;
  const selectedCompetition = query.competition ?? "all";
  const selectedTeam = query.team ?? "all";
  const selectedPosition = query.position ?? "all";

  const visiblePlayers = players.filter((player) => {
    const team = getTeamById(player.teamId);
    const competitionMatch =
      selectedCompetition === "all" || team?.competitionIds.includes(selectedCompetition);
    const teamMatch = selectedTeam === "all" || player.teamId === selectedTeam;
    const positionMatch = selectedPosition === "all" || player.positionGroup === selectedPosition;

    return competitionMatch && teamMatch && positionMatch;
  });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Squads"
        title="Players"
        description="Player profiles keep date of birth, squad number, position category, detailed position, and calculated season statistics."
      />

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect
          label="Season"
          name="season"
          value={query.season ?? seasons[0].id}
          options={seasons.map((season) => ({ value: season.id, label: season.label }))}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...competitions.map((competition) => ({ value: competition.id, label: competition.name })),
          ]}
        />
        <FilterSelect
          label="Team"
          name="team"
          value={selectedTeam}
          options={[{ value: "all", label: "All teams" }, ...teams.map((team) => ({ value: team.id, label: team.name }))]}
        />
        <FilterSelect label="Position" name="position" value={selectedPosition} options={positionOptions} />
        <button className="mt-5 h-10 rounded-lg bg-blue-700 px-4 text-sm font-black text-white" type="submit">
          Apply
        </button>
      </form>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visiblePlayers.map((player) => {
          const team = getTeamById(player.teamId);

          return (
            <Link
              key={player.id}
              href={`/players/${player.slug}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Image src={player.photo} alt={`${player.name} photo`} width={58} height={58} className="h-14 w-14 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-black text-slate-950">#{player.number} {player.name}</p>
                  <p className="text-sm font-semibold text-slate-500">{team?.name}</p>
                  <p className="text-xs font-semibold text-blue-700">
                    {player.positionGroup} | {player.detailedPosition} | Age {calculateAge(player.dateOfBirth)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="Goals" value={player.goals.toString()} />
                <Stat label="Assists" value={player.assists.toString()} />
                <Stat label="Apps" value={player.appearances.toString()} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

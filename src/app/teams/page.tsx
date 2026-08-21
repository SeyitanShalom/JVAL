import Image from "next/image";
import Link from "next/link";
import FilterSelect from "../components/FilterSelect";
import SectionHeader from "../components/SectionHeader";
import { competitions, getCompetitionById, seasons, teams } from "@/lib/league-data";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const selectedCompetition = query.competition ?? "all";
  const visibleTeams =
    selectedCompetition === "all"
      ? teams
      : teams.filter((team) => team.competitionIds.includes(selectedCompetition));

  const topTeam = [...visibleTeams].sort((a, b) => b.points - a.points)[0];
  const totalGoals = visibleTeams.reduce((sum, team) => sum + team.goalsFor, 0);
  const selectedCompetitionName =
    selectedCompetition === "all" ? "All competitions" : getCompetitionById(selectedCompetition)?.name;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Club Directory"
        title="Teams"
        description="Season squad limit is 25 players per team, with squads entered from the admin dashboard."
      />

      <form className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
        <button className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-black text-white" type="submit">
          Apply
        </button>
      </form>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Filter" value={selectedCompetitionName ?? "All competitions"} />
        <SummaryCard label="Teams" value={visibleTeams.length.toString()} />
        <SummaryCard label="Goals" value={`${totalGoals} total`} />
      </section>

      {topTeam ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-900">
          Current leader: {topTeam.name} with {topTeam.points} points.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {visibleTeams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.slug}`}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4 p-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                <Image src={team.logo} alt={`${team.name} logo`} width={44} height={44} className="h-11 w-11 object-contain" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-black text-slate-950">{team.name}</p>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                    Pot {team.pot}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">{team.community}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Coach: {team.coach}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Captain: {team.captain}</p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-slate-950">{team.points}</p>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">points</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

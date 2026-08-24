import Image from "next/image";
import Link from "next/link";
import FilterSelect from "../components/FilterSelect";
import SectionHeader from "../components/SectionHeader";
import { getPublicTeamsData } from "@/lib/public-data";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ competition?: string; season?: string }>;
}) {
  const query = await searchParams;
  const data = await getPublicTeamsData(query);

  const selectedCompetition = query.competition ?? "all";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Club Directory"
        title="Teams"
        description="Squad limits of 25 players per team with registered coaches, captains, and pots."
      />

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <FilterSelect
          label="Season"
          name="season"
          value={query.season ?? data.seasonsList[0].id}
          options={data.seasonsList.map((s) => ({ value: s.id, label: s.label }))}
        />
        <FilterSelect
          label="Competition"
          name="competition"
          value={selectedCompetition}
          options={[
            { value: "all", label: "All competitions" },
            ...data.competitionsList.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <button
          className="h-10 rounded-lg bg-blue-700 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800"
          type="submit"
        >
          Apply
        </button>
      </form>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Scope" value={data.selectedCompetitionName} />
        <SummaryCard label="Enrolled Clubs" value={`${data.teams.length} teams`} />
        <SummaryCard label="Goals Scored" value={`${data.totalGoals} goals`} />
      </section>

      {data.topTeam && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700">
          🏆 Current table leader: <span className="font-bold">{data.topTeam.name}</span> with {data.topTeam.points} points.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {data.teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.slug}`}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2">
                <Image
                  src={team.logo}
                  alt={`${team.name} logo`}
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-base font-bold text-slate-950 group-hover:text-blue-600 transition">
                    {team.name}
                  </p>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                    Pot {team.pot}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-500">{team.community}</p>
                <p className="mt-1 text-[11px] font-bold text-slate-400">
                  Coach: <span className="text-slate-700">{team.coach}</span> · Captain:{" "}
                  <span className="text-slate-700">{team.captain}</span>
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-blue-700 tabular-nums">{team.points}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PTS</p>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-950">{value}</p>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import CompactFilterForm from "../components/CompactFilterForm";
import FilterSelect from "../components/FilterSelect";
import SectionHeader from "../components/SectionHeader";
import {
  getPublicCompetitionFilterLabel,
  getPublicTeamsData,
} from "@/lib/public-data";
import { type Team } from "@/lib/league-data";

type TeamsPageData = Awaited<ReturnType<typeof getPublicTeamsData>>;
type CompetitionSection = TeamsPageData["sections"][number];

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
        description="Teams are listed under their own competition tables, with points kept separate from the Super Cup until it starts."
      />

      <CompactFilterForm
        resultLabel={`${data.teams.length} team${data.teams.length !== 1 ? "s" : ""}`}
      >
        <FilterSelect
          label="Season"
          name="season"
          value={query.season ?? data.seasonsList[0].id}
          options={data.seasonsList.map((s) => ({
            value: s.id,
            label: s.label,
          }))}
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
      </CompactFilterForm>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Scope" value={data.selectedCompetitionName} />
        <SummaryCard
          label="Tables Shown"
          value={`${data.sections.length} competition${data.sections.length !== 1 ? "s" : ""}`}
        />
        <SummaryCard
          label="Team Entries"
          value={`${data.teams.length} teams`}
        />
      </section>

      {data.topTeam ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-500">
          Current points leader in this view:{" "}
          <span className="font-bold">{data.topTeam.name}</span> with{" "}
          {data.topTeam.points} points.
        </div>
      ) : null}

      <div className="space-y-8">
        {data.sections.map((section) => (
          <section key={section.competition.id} className="space-y-3">
            <SectionHeader
              eyebrow={section.competition.type}
              title={section.competition.name}
              description={getSectionDescription(section)}
            />

            {section.teams.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {section.teams.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-sm font-semibold text-slate-500 shadow-sm">
                {section.isPendingSuperCup
                  ? "Super Cup teams and points will appear here once the competition begins."
                  : "No teams listed for this competition yet."}
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

function TeamCard({ team }: { team: Team }) {
  return (
    <Link
      href={`/teams/${team.slug}`}
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-red-500 hover:shadow-md"
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
            <p className="truncate text-base font-bold text-slate-950 transition group-hover:text-red-500">
              {team.name}
            </p>
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-500">
              Pot {team.pot}
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {team.community}
          </p>
          <p className="mt-1 text-[11px] font-bold text-slate-400">
            Coach: <span className="text-slate-700">{team.coach}</span> -
            Captain: <span className="text-slate-700">{team.captain}</span>
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold text-blue-700 tabular-nums">
            {team.points}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            PTS
          </p>
        </div>
      </div>
    </Link>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-950">{value}</p>
    </div>
  );
}

function getSectionDescription(section: CompetitionSection) {
  if (section.isPendingSuperCup) {
    return "The Super Cup is not active yet, so its qualified teams and points are hidden for now.";
  }

  const teamLabel = `${section.teams.length} team${section.teams.length !== 1 ? "s" : ""}`;

  if (!section.topTeam) {
    return `${teamLabel} listed for this competition.`;
  }

  return `${teamLabel} listed by points. ${section.topTeam.name} lead with ${section.topTeam.points} points.`;
}

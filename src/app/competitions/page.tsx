import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import SectionHeader from "../components/SectionHeader";
import { getPublicCompetitions } from "@/lib/public-data";

export default async function CompetitionsPage() {
  const competitionsList = await getPublicCompetitions();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Tournament Structure"
        title="Competitions"
        description="Local government competitions feeding the top 8 teams into the knockout rounds and Super Cup tournament."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {competitionsList.map((competition) => (
          <Link
            key={competition.id}
            href={`/competitions/${competition.slug}`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
                  {competition.type}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-950 group-hover:text-blue-600 transition">
                  {competition.name}
                </h2>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-600">
                {competition.status}
              </span>
            </div>

            <p className="mt-3 text-sm font-semibold leading-5 text-slate-600 line-clamp-2">
              {competition.description}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
              <Stat label="Teams" value={competition.plannedTeams.toString()} />
              <Stat label="Pots" value={competition.potCount.toString()} />
              <Stat label="Qualify" value={`Top ${competition.qualifiers}`} />
              <Stat label="Knockout" value={competition.knockoutStart.replace(/_/g, " ")} />
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-xs font-bold text-slate-600">
                Leader: <span className="font-bold text-slate-950">{competition.leaderName}</span>
              </p>
              <FiArrowRight className="text-blue-600 transition group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

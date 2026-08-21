import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import SectionHeader from "../components/SectionHeader";
import { competitions, getTableRows } from "@/lib/league-data";

export default function CompetitionsPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Tournament"
        title="Competitions"
        description="Each season can expand with new local government, state, or Super Cup competitions while keeping tables and archives separate."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {competitions.map((competition) => {
          const rows = getTableRows(competition.id);
          const leader = rows[0];

          return (
            <Link
              key={competition.id}
              href={`/competitions/${competition.slug}`}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">
                    {competition.type}
                  </p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">{competition.name}</h2>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black capitalize text-blue-700">
                  {competition.status}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">{competition.description}</p>

              <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                <Stat label="Teams" value={competition.plannedTeams.toString()} />
                <Stat label="Pots" value={competition.potCount.toString()} />
                <Stat label="Qualify" value={competition.qualifiers.toString()} />
                <Stat label="Knockout" value={competition.knockoutStart} />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm font-bold text-slate-600">
                  Leader: <span className="text-slate-950">{leader?.name ?? "Not started"}</span>
                </p>
                <FiArrowRight className="text-blue-700" aria-hidden="true" />
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
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

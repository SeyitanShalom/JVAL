import Image from "next/image";
import SectionHeader from "../components/SectionHeader";

export default function AboutPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="grid gap-8 rounded-lg bg-white p-6 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <div>
          <div className="flex items-center gap-3">
            <Image src="/JV Logo.webp" alt="Johnvents" width={80} height={36} className="h-auto w-20" />
            <Image src="/Apex Logo.png" alt="Apex League" width={96} height={44} className="h-auto w-24" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-red-500">
            Powered by Johnvents Foods
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
            Johnvents Apex League
          </h1>
        </div>
        <div className="space-y-4 text-base font-semibold leading-7 text-slate-700">
          <p>
            Johnvents Apex League is a seasonal football tournament platform for
            local government competitions, Super Cup qualification, live match
            updates, tables, player statistics, awards, and records.
          </p>
          <p>
            The tournament structure is designed to grow from the current set of
            competitions into future local government, state, or expanded seasonal
            formats without rebuilding the public website.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <SectionHeader title="Tournament Format" />
        <div className="grid gap-3 md:grid-cols-3">
          <Info title="Group Phase" text="Teams are placed into four pots and can face teams from every pot, including their own pot." />
          <Info title="Qualification" text="Local government competitions send the top eight teams into the knockout stage and Super Cup pathway." />
          <Info title="Knockout" text="Drawn knockout matches go straight to penalties, with no extra time." />
        </div>
      </section>
    </section>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </article>
  );
}

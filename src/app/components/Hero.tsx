import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiRadio } from "react-icons/fi";
import { competitions, matches } from "@/lib/league-data";

const Hero = () => {
  const liveMatch = matches.find((match) => match.status === "live");
  const activeCompetitions = competitions.filter((competition) => competition.status === "active").length;

  return (
    <section className="relative -mx-4 overflow-hidden bg-slate-950 px-4 text-white sm:-mx-6 sm:px-6">
      <Image
        src="/still-life-colombian-national-soccer-team.jpg"
        alt="Football boots and match ball"
        fill
        sizes="100vw"
        preload
        className="object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-blue-600/25" />

      <div className="relative mx-auto grid min-h-[430px] max-w-6xl content-center gap-8 py-12 md:grid-cols-[1.1fr_0.9fr] md:py-16">
        <div className="max-w-2xl">
          <div className="flex items-center">
            <Image src="/JV Logo.webp" alt="Johnvents" width={70} height={32} className="h-auto w-[68px] p-1" />
            <Image
              src="/Apex Logo.png"
              alt="Apex League"
              width={84}
              height={40}
              className="h-auto w-[82px] p-1 brightness-0 invert"
            />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-blue-100">
            Powered by Johnvents Foods
          </p>
          <h1 className="mt-3 text-4xl font-black leading-[0.98] tracking-normal sm:text-6xl">
            Johnvents Apex League
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-5 text-white/88">
            A seasonal football tournament platform for competitions, fixtures,
            live match updates, tables, player stats, awards, and records.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/fixtures?status=live"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-xs font-black text-blue-800"
            >
              <FiRadio aria-hidden="true" />
              Live center
            </Link>
            <Link
              href="/competitions"
              className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-3 text-xs font-black text-white"
            >
              Competitions
              <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="grid gap-3 self-end sm:grid-cols-3 md:grid-cols-1">
          <Stat label="Active competitions" value={activeCompetitions.toString()} />
          <Stat label="Season" value="2026/2027" />
          <Stat label="Live now" value={liveMatch ? "1 match" : "0 matches"} />
        </div>
      </div>
    </section>
  );
};

export default Hero;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-100">{label}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}

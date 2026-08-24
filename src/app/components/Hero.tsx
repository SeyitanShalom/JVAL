import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiRadio } from "react-icons/fi";

type HeroProps = {
  activeCompetitions: number;
  currentSeason: string;
  liveMatchCount: number;
};

export default function Hero({
  activeCompetitions,
  currentSeason,
  liveMatchCount,
}: HeroProps) {
  return (
    <section className="relative -mx-4 overflow-hidden bg-slate-950 px-4 text-white sm:-mx-6 sm:px-6">
      <Image
        src="/still-life-colombian-national-soccer-team.jpg"
        alt="Football boots and match ball"
        fill
        sizes="100vw"
        priority
        className="object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-slate-950/60 to-slate-950/80" />

      <div className="relative mx-auto grid min-h-[440px] max-w-6xl content-center gap-8 py-12 md:grid-cols-[1.15fr_0.85fr] md:py-16">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <Image
              src="/JV Logo.webp"
              alt="Johnvents"
              width={70}
              height={32}
              className="h-auto w-[68px]"
            />
            <Image
              src="/Apex Logo.png"
              alt="Apex League"
              width={84}
              height={40}
              className="h-auto w-[82px] brightness-0 invert"
            />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
            Powered by Johnvents Foods
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[0.98] tracking-tight sm:text-6xl">
            Johnvents Apex League
          </h1>
          <p className="mt-4 max-w-xl text-sm font-semibold leading-relaxed text-slate-200">
            The official football tournament platform for local government competitions, Super Cup
            fixtures, live match updates, tables, player statistics, awards, and records.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/fixtures?status=live"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
            >
              <FiRadio aria-hidden="true" className={liveMatchCount > 0 ? "animate-pulse text-red-400" : ""} />
              {liveMatchCount > 0 ? `Live Center (${liveMatchCount})` : "Match Center"}
            </Link>
            <Link
              href="/competitions"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              Competitions
              <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="grid gap-3 self-end sm:grid-cols-3 md:grid-cols-1">
          <Stat label="Active competitions" value={activeCompetitions.toString()} />
          <Stat label="Season Edition" value={currentSeason} />
          <Stat
            label="Live matches"
            value={liveMatchCount > 0 ? `${liveMatchCount} in progress` : "None live"}
            highlight={liveMatchCount > 0}
          />
        </div>
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
    <div
      className={`rounded-xl border p-4 backdrop-blur transition ${
        highlight
          ? "border-emerald-400/40 bg-emerald-950/40"
          : "border-white/15 bg-white/10"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-200">{label}</p>
      <p className="mt-1.5 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

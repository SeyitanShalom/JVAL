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
  const stats = [
    { label: "Season", value: currentSeason },
    { label: "Active", value: activeCompetitions.toString() },
    { label: "Live", value: liveMatchCount.toString() },
  ];

  return (
    <section className="-mx-4 border-y border-red-100 bg-white px-4 py-5 sm:-mx-6 sm:px-6 lg:py-7">
      <div className="mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
      <div className="min-w-0 text-center lg:text-left">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">
          Game On With Goodness
        </p>
        <h1 className="mt-2 text-2xl font-black leading-tight text-slate-950 sm:text-3xl lg:text-4xl">
          Johnvents Apex League
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-slate-600 lg:mx-0">
          Stay updated with real-time scores, team stats, and match-day actions
          from Johnvents Apex League. Dive into fixtures, player stats, and
          league tables all in one place. Football lives here.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-start">
          <Link
            href="/fixtures"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-red-600"
          >
            View fixtures
            <FiArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={liveMatchCount > 0 ? "/fixtures?status=live" : "/tables"}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-xs font-bold text-red-500 transition hover:bg-red-50"
          >
            <FiRadio className="h-4 w-4" aria-hidden="true" />
            {liveMatchCount > 0 ? "Live center" : "View standings"}
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-left">
          {stats.map((item) => (
            <div key={item.label} className="rounded-lg bg-red-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-red-400">
                {item.label}
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
      <Image
        src="/Hero Image.png"
        alt=""
        width={400}
        height={400}
        priority
        className="mx-auto h-auto w-full max-w-[18rem] shrink-0 sm:max-w-[22rem] lg:max-w-[24rem]"
      />
      </div>
    </section>
  );
}

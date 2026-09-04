import type { IconType } from "react-icons";
import Link from "next/link";
import { FiAward, FiLock, FiSlash, FiTarget } from "react-icons/fi";
import SectionHeader from "../components/SectionHeader";
import WeeklyPredictionForm, {
  type WeeklyPredictionMatch,
} from "./WeeklyPredictionForm";
import { getPublicFixturesData } from "@/lib/public-data";
import {
  defaultTeamLogo,
  type Match,
} from "@/lib/league-data";
import {
  canPredictFixture,
  getActivePredictionWeekKey,
  getPredictionWeekOptions,
  getPredictionWeekForMatches,
  type PredictionWeekOption,
} from "@/lib/prediction-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PredictPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const query = await searchParams;
  const now = new Date();
  const data = await getPublicFixturesData();
  const predictionWeek = getPredictionWeekForMatches(
    data.matches,
    now,
    query.week,
  );
  const weekOptions = getPredictionWeekOptions(data.matches, now);
  const activeWeekKey = getActivePredictionWeekKey(now);
  const isEditableWeek = predictionWeek.weekKey === activeWeekKey;
  const activeWeekTitle =
    weekOptions.find((week) => week.weekKey === activeWeekKey)?.title ??
    predictionWeek.title;
  const matches = predictionWeek.matches.map((match) =>
    mapMatchForPrediction(match, now),
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Prediction Center"
        title="Predict"
        description="Pick every match in the active prediction week before kickoff."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-4">
          <PredictionWeekTabs
            weeks={weekOptions}
            selectedWeekKey={predictionWeek.weekKey}
          />

          <WeeklyPredictionForm
            key={predictionWeek.weekKey}
            weekKey={predictionWeek.weekKey}
            weekTitle={predictionWeek.title}
            activeWeekTitle={activeWeekTitle}
            isEditableWeek={isEditableWeek}
            matches={matches}
          />
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white">
              <FiTarget className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">
                Scoring
              </p>
              <h2 className="text-base font-bold text-slate-950">
                Points Rules
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <RuleMetric icon={FiAward} label="Exact score" value="5 pts" />
            <RuleMetric icon={FiSlash} label="Wrong score" value="0 pts" />
            <RuleMetric icon={FiTarget} label="Perfect week" value="+10 pts" />
            <RuleMetric icon={FiLock} label="Lock time" value="Kickoff" />
          </div>

          <p className="mt-5 text-xs font-semibold leading-5 text-slate-500">
            Points are added automatically after the admin records the final
            score.
          </p>
        </aside>
      </div>
    </section>
  );
}

function mapMatchForPrediction(match: Match, now: Date): WeeklyPredictionMatch {
  return {
    id: match.id,
    slug: match.slug,
    matchday: match.matchday,
    date: match.date,
    status: match.status,
    locked: !canPredictFixture(
      { kickoffAt: match.date, status: match.status },
      now,
    ),
    competitionName: match.competitionName ?? "Competition",
    venueName: match.venueName ?? match.venueLocation ?? "Venue TBC",
    homeTeam: {
      name: match.homeTeamName ?? match.homeTeamShort ?? "Home Team",
      shortName: match.homeTeamShort ?? "HOM",
      logo: match.homeTeamLogo ?? defaultTeamLogo,
    },
    awayTeam: {
      name: match.awayTeamName ?? match.awayTeamShort ?? "Away Team",
      shortName: match.awayTeamShort ?? "AWY",
      logo: match.awayTeamLogo ?? defaultTeamLogo,
    },
  };
}

function PredictionWeekTabs({
  weeks,
  selectedWeekKey,
}: {
  weeks: PredictionWeekOption[];
  selectedWeekKey: string;
}) {
  return (
    <nav
      aria-label="Prediction weeks"
      className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
    >
      <div className="flex min-w-max gap-2">
        {weeks.map((week) => {
          const selected = week.weekKey === selectedWeekKey;

          return (
            <Link
              key={week.weekKey}
              href={`/predict?week=${week.weekKey}`}
              className={`grid min-w-[9.5rem] gap-1 rounded-md px-3 py-2 text-left transition ${
                selected
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.08em] ${
                  selected
                    ? "text-red-200"
                    : week.isActive
                      ? "text-red-500"
                      : "text-slate-400"
                }`}
              >
                {week.isActive ? "Open week" : "View week"}
              </span>
              <span className="text-xs font-bold">{week.title}</span>
              <span
                className={`text-[11px] font-semibold ${
                  selected ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {week.matchCount} match{week.matchCount === 1 ? "" : "es"}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function RuleMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
      <span className="inline-flex min-w-0 items-center gap-2 text-xs font-bold text-slate-600">
        <Icon className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-sm font-bold text-slate-950">{value}</span>
    </div>
  );
}

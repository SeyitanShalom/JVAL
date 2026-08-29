import type { IconType } from "react-icons";
import { FiAward, FiLock, FiSlash, FiTarget } from "react-icons/fi";
import SectionHeader from "../components/SectionHeader";
import WeeklyPredictionForm, {
  type WeeklyPredictionMatch,
} from "./WeeklyPredictionForm";
import { getPublicFixturesData } from "@/lib/public-data";
import {
  getCompetitionById,
  getTeamById,
  getVenueById,
  type Match,
} from "@/lib/league-data";
import {
  getPredictionWeekForMatches,
  isPredictionLocked,
} from "@/lib/prediction-utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PredictPage() {
  const data = await getPublicFixturesData();
  const predictionWeek = getPredictionWeekForMatches(data.matches);
  const matches = predictionWeek.matches.map(mapMatchForPrediction);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Prediction Center"
        title="Predict"
        description="Pick every match in the active prediction week before kickoff."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <WeeklyPredictionForm
          weekKey={predictionWeek.weekKey}
          weekTitle={predictionWeek.title}
          matches={matches}
        />

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

function mapMatchForPrediction(match: Match): WeeklyPredictionMatch {
  const fallbackHome = getTeamById(match.homeTeamId);
  const fallbackAway = getTeamById(match.awayTeamId);
  const fallbackCompetition = getCompetitionById(match.competitionId);
  const fallbackVenue = getVenueById(match.venueId);

  return {
    id: match.id,
    slug: match.slug,
    matchday: match.matchday,
    date: match.date,
    status: match.status,
    locked: match.status !== "upcoming" || isPredictionLocked(match.date),
    competitionName: match.competitionName ?? fallbackCompetition.name,
    venueName: match.venueName ?? fallbackVenue.name,
    homeTeam: {
      name: match.homeTeamName ?? fallbackHome.name,
      shortName: match.homeTeamShort ?? fallbackHome.shortName,
      logo: match.homeTeamLogo ?? fallbackHome.logo,
    },
    awayTeam: {
      name: match.awayTeamName ?? fallbackAway.name,
      shortName: match.awayTeamShort ?? fallbackAway.shortName,
      logo: match.awayTeamLogo ?? fallbackAway.logo,
    },
  };
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

import Image from "next/image";
import Link from "next/link";
import type { IconType } from "react-icons";
import {
  FiCalendar,
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";
import SectionHeader from "../components/SectionHeader";
import { getPublicFixturesData } from "@/lib/public-data";
import {
  formatDate,
  formatMatchTime,
  getCompetitionById,
  getTeamById,
  getVenueById,
  type Match,
} from "@/lib/league-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PredictPage() {
  const data = await getPublicFixturesData({ status: "upcoming" });
  const upcomingMatches = data.matches.slice(0, 8);
  const activeCompetitionCount = data.competitionsList.filter(
    (competition) => competition.status === "active",
  ).length;
  const nextMatch = upcomingMatches[0];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <SectionHeader
        eyebrow="Prediction Center"
        title="Predict"
        description="Upcoming Apex League fixtures ready for match picks and score calls."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          {upcomingMatches.length ? (
            upcomingMatches.map((match) => (
              <PredictionFixtureCard key={match.id} match={match} />
            ))
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <p className="text-sm font-bold text-slate-950">
                No upcoming fixtures
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                New matches will appear here once the fixture list is updated.
              </p>
            </div>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500 text-white">
              <FiTarget className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">
                Match Picks
              </p>
              <h2 className="text-base font-bold text-slate-950">
                Prediction Board
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <PredictionMetric
              icon={FiCalendar}
              label="Upcoming fixtures"
              value={data.matches.length.toString()}
            />
            <PredictionMetric
              icon={FiTrendingUp}
              label="Active competitions"
              value={activeCompetitionCount.toString()}
            />
            <PredictionMetric
              icon={FiClock}
              label="Next kickoff"
              value={nextMatch ? formatMatchTime(nextMatch.date) : "TBD"}
            />
          </div>

          <Link
            href="/fixtures?status=upcoming"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-xs font-bold text-white transition hover:bg-red-600"
          >
            View all fixtures
            <FiChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </section>
  );
}

function PredictionFixtureCard({ match }: { match: Match }) {
  const fallbackHome = getTeamById(match.homeTeamId);
  const fallbackAway = getTeamById(match.awayTeamId);
  const fallbackCompetition = getCompetitionById(match.competitionId);
  const fallbackVenue = getVenueById(match.venueId);
  const home = {
    name: match.homeTeamName ?? fallbackHome.name,
    shortName: match.homeTeamShort ?? fallbackHome.shortName,
    logo: match.homeTeamLogo ?? fallbackHome.logo,
  };
  const away = {
    name: match.awayTeamName ?? fallbackAway.name,
    shortName: match.awayTeamShort ?? fallbackAway.shortName,
    logo: match.awayTeamLogo ?? fallbackAway.logo,
  };
  const competitionName = match.competitionName ?? fallbackCompetition.name;
  const venueName = match.venueName ?? fallbackVenue.name;

  return (
    <Link
      href={`/matches/${match.slug}`}
      className="group block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-500 hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <FiCalendar className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
          {formatDate(match.date)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FiClock className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
          {formatMatchTime(match.date)}
        </span>
        <span className="truncate">{competitionName}</span>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] items-center gap-3">
        <PredictionTeam team={home} />
        <span className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-500">
          vs
        </span>
        <PredictionTeam team={away} align="right" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-slate-700">
          {home.shortName}
        </span>
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-slate-700">
          Draw
        </span>
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-slate-700">
          {away.shortName}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs font-bold text-slate-500">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <FiMapPin className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
          <span className="truncate">{venueName}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-red-500">
          Open fixture
          <FiChevronRight
            className="h-4 w-4 transition group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

function PredictionTeam({
  team,
  align = "left",
}: {
  team: { name: string; shortName: string; logo: string };
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${
        align === "right" ? "justify-end text-right" : ""
      }`}
    >
      {align === "left" ? (
        <Image
          src={team.logo}
          alt={`${team.name} logo`}
          width={34}
          height={34}
          className="h-8 w-8 shrink-0 object-contain"
        />
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">{team.name}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {team.shortName}
        </p>
      </div>
      {align === "right" ? (
        <Image
          src={team.logo}
          alt={`${team.name} logo`}
          width={34}
          height={34}
          className="h-8 w-8 shrink-0 object-contain"
        />
      ) : null}
    </div>
  );
}

function PredictionMetric({
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

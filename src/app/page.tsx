import News from "./components/News";
import Hero from "./components/Hero";
import LiveMatches from "./components/LiveMatches";
import UpcomingMatches from "./components/UpcomingMatches";
import FinishedMatches from "./components/FinishedMatches";
import PlayerStats from "./components/PlayerStats";
import LeagueTable from "./components/LeagueTable";
import SectionHeader from "./components/SectionHeader";
import { getPublicHomeData } from "@/lib/public-data";

export default async function HomePage() {
  const data = await getPublicHomeData();

  return (
    <div className="px-4 pb-16 sm:px-6">
      <Hero
        activeCompetitions={data.activeCompetitionCount}
        currentSeason={data.currentSeasonLabel}
        liveMatchCount={data.liveMatches.length}
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-12 py-10">
        {data.liveMatches.length > 0 && <LiveMatches matches={data.liveMatches} />}
        <UpcomingMatches matches={data.upcomingMatches} />
        <FinishedMatches matches={data.finishedMatches} />
        <News posts={data.recentNews} />
        <section className="space-y-3">
          <SectionHeader
            title={`${data.featuredCompetitionName} Table`}
            actionHref="/tables"
            actionLabel="All tables"
          />
          <LeagueTable teams={data.featuredTableRows} compact />
        </section>
        <PlayerStats scorers={data.topScorers} />
      </div>
    </div>
  );
}

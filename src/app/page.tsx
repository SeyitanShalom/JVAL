import News from "./components/News";
import Hero from "./components/Hero";
import LiveMatches from "./components/LiveMatches";
import UpcomingMatches from "./components/UpcomingMatches";
import FinishedMatches from "./components/FinishedMatches";
import PlayerStats from "./components/PlayerStats";
import LeagueTable from "./components/LeagueTable";
import SectionHeader from "./components/SectionHeader";
import { getTableRows } from "@/lib/league-data";

const Page = () => {
  const tableRows = getTableRows("akure").slice(0, 6);

  return (
    <div className="px-4 pb-12 sm:px-6">
      <Hero />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 py-10">
        <News />
        <LiveMatches />
        <UpcomingMatches />
        <FinishedMatches />
        <section className="space-y-3">
          <SectionHeader title="Akure South & North Table" actionHref="/tables" actionLabel="All tables" />
          <LeagueTable teams={tableRows} compact />
        </section>
        <PlayerStats />
      </div>
    </div>
  );
};

export default Page;

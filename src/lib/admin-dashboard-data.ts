import {
  awardsRecords,
  competitions,
  galleryItems,
  matches,
  newsPosts,
  players,
  seasons,
  teams,
  venues,
} from "@/lib/league-data";

export const currentSeason = seasons.find((season) => season.status === "active") ?? seasons[0];

export const adminOverview = {
  liveMatches: matches.filter((match) => match.status === "live"),
  upcomingFixtures: matches.filter((match) => match.status === "upcoming"),
  pendingResults: matches.filter((match) => match.status === "finished" && !match.referee),
  recentNews: [...newsPosts].sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()),
  totalTeams: teams.length,
  totalPlayers: players.length,
  activeCompetitions: competitions.filter((competition) => competition.status === "active"),
  currentSeason,
};

export const adminResources = [
  {
    title: "Competitions",
    href: "/admin/competitions",
    count: competitions.length,
    detail: `${adminOverview.activeCompetitions.length} active`,
  },
  {
    title: "Fixtures",
    href: "/admin/fixtures",
    count: matches.length,
    detail: `${adminOverview.liveMatches.length} live`,
  },
  {
    title: "Teams",
    href: "/admin/teams",
    count: teams.length,
    detail: "Squad limit 25",
  },
  {
    title: "Players",
    href: "/admin/players",
    count: players.length,
    detail: "DOB stored",
  },
  {
    title: "Statistics",
    href: "/admin/statistics",
    count: players.length + teams.length,
    detail: "Auto-calculated",
  },
  {
    title: "News",
    href: "/admin/news",
    count: newsPosts.length,
    detail: "Linked to competitions",
  },
  {
    title: "Galleries",
    href: "/admin/galleries",
    count: galleryItems.length,
    detail: "Flexible scopes",
  },
  {
    title: "Venues",
    href: "/admin/venues",
    count: venues.length,
    detail: "Neutral matches",
  },
  {
    title: "Awards",
    href: "/admin/awards-records",
    count: awardsRecords.length,
    detail: "Season tracked",
  },
];

export const liveControlEvents = [
  "Start match",
  "Add goal",
  "Add assist",
  "Add yellow card",
  "Add red card",
  "Add substitution",
  "Add injury/update note",
  "Start halftime",
  "Resume second half",
  "End match",
  "Publish final result",
];

export const tournamentRuleSummary = [
  { label: "Points", value: "Win 3, Draw 1, Loss 0" },
  { label: "Pots", value: "4 per competition" },
  { label: "LG qualifiers", value: "Top 8" },
  { label: "Super Cup qualifiers", value: "Top 16" },
  { label: "Knockout ties", value: "Straight to penalties" },
  { label: "Third place", value: "Enabled" },
];

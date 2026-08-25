import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import {
  awardsRecords,
  calculateAge,
  competitions,
  formatDate,
  formatMatchTime,
  galleryItems,
  getAssistLeaders,
  getCleanSheetLeaders,
  getCompetitionById,
  getCompetitionBySlug,
  getMatchBySlug,
  getMatchesForCompetition,
  getMatchesForTeam,
  getNewsPostBySlug,
  getPlayerById,
  getPlayerBySlug,
  getPlayersForTeam,
  getTableRows,
  getTeamById,
  getTeamBySlug,
  getTeamsForCompetition,
  getTopScorers,
  getVenueById,
  matches,
  newsPosts,
  players,
  seasons,
  teams,
  venues,
  type AwardRecord,
  type Competition,
  type GalleryItem,
  type Match,
  type NewsPost,
  type Player,
  type Season,
  type Team,
  type Venue,
} from "@/lib/league-data";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type BracketTeam = {
  id: string;
  name: string;
  shortName: string;
  logo: string;
};

export type BracketMatch = {
  id: string;
  slug: string;
  stage: string;
  matchNumber: number;
  home: BracketTeam | null;
  away: BracketTeam | null;
  homeScore: number | null;
  awayScore: number | null;
  penalties: { home: number; away: number } | null;
  status: "upcoming" | "live" | "finished" | "postponed";
};

export type PublicHomeData = {
  liveMatches: Match[];
  upcomingMatches: Match[];
  finishedMatches: Match[];
  recentNews: NewsPost[];
  featuredTableRows: Team[];
  featuredCompetitionName: string;
  topScorers: Player[];
  activeCompetitionCount: number;
  currentSeasonLabel: string;
};

// ─── 1. HOME DATA ────────────────────────────────────────────────────────────

export async function getPublicHomeData(): Promise<PublicHomeData> {
  const currentSeason = seasons.find((s) => s.status === "active") ?? seasons[0];
  const sampleTable = getTableRows("akure").slice(0, 6);

  if (!hasDatabaseConfig()) {
    return {
      liveMatches: matches.filter((m) => m.status === "live"),
      upcomingMatches: matches.filter((m) => m.status === "upcoming").slice(0, 3),
      finishedMatches: matches.filter((m) => m.status === "finished").slice(0, 3),
      recentNews: newsPosts.slice(0, 3),
      featuredTableRows: sampleTable,
      featuredCompetitionName: "Akure South & North",
      topScorers: getTopScorers(5),
      activeCompetitionCount: competitions.filter((c) => c.status === "active").length,
      currentSeasonLabel: currentSeason.label,
    };
  }

  try {
    const prisma = getPrismaClient();

    const [
      dbLiveMatches,
      dbUpcomingMatches,
      dbFinishedMatches,
      dbNews,
      dbCompetitions,
      currentSeasonDb,
    ] = await Promise.all([
      prisma.match.findMany({
        where: { status: { in: ["LIVE", "HALFTIME"] } },
        orderBy: { kickoffAt: "asc" },
        take: 3,
        include: {
          competition: true,
          venue: true,
          homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
          awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
        },
      }),
      prisma.match.findMany({
        where: { status: "UPCOMING" },
        orderBy: { kickoffAt: "asc" },
        take: 3,
        include: {
          competition: true,
          venue: true,
          homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
          awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
        },
      }),
      prisma.match.findMany({
        where: { status: "FULLTIME" },
        orderBy: { kickoffAt: "desc" },
        take: 3,
        include: {
          competition: true,
          venue: true,
          homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
          awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
        },
      }),
      prisma.newsPost.findMany({
        orderBy: { publishDate: "desc" },
        take: 3,
        include: { competition: true },
      }),
      prisma.competition.findMany({
        where: { status: "ACTIVE" },
      }),
      prisma.season.findFirst({
        where: { isCurrent: true },
      }),
    ]);

    const mapDbMatch = (m: any): Match => ({
      id: m.id,
      slug: m.slug,
      seasonId: m.seasonId ?? "season-1",
      competitionId: m.competitionId,
      matchday: m.matchday,
      stage: "group",
      homeTeamId: m.homeCompetitionTeam?.teamSeason?.team?.id ?? "team-1",
      awayTeamId: m.awayCompetitionTeam?.teamSeason?.team?.id ?? "team-2",
      venueId: m.venueId,
      date: m.kickoffAt.toISOString(),
      status:
        m.status === "LIVE" || m.status === "HALFTIME"
          ? "live"
          : m.status === "FULLTIME"
          ? "finished"
          : m.status === "POSTPONED"
          ? "postponed"
          : "upcoming",
      minute: m.minuteLabel ?? undefined,
      homeScore: m.homeScore ?? undefined,
      awayScore: m.awayScore ?? undefined,
      penalties:
        m.homePenaltyScore !== null && m.awayPenaltyScore !== null
          ? {
              home: m.homePenaltyScore,
              away: m.awayPenaltyScore,
              attempts: [],
            }
          : undefined,
      referee: m.referee ?? undefined,
      formationHome: undefined,
      formationAway: undefined,
      events: [],
    });

    const mappedLive = dbLiveMatches.map(mapDbMatch);
    const mappedUpcoming = dbUpcomingMatches.map(mapDbMatch);
    const mappedFinished = dbFinishedMatches.map(mapDbMatch);

    const mappedNews: NewsPost[] = dbNews.map((n) => ({
      id: n.id,
      slug: n.slug,
      competitionId: n.competitionId,
      title: n.title,
      excerpt: n.excerpt ?? "",
      content: [n.content],
      coverImage: n.coverImageUrl,
      publishDate: n.publishDate.toISOString(),
    }));

    return {
      liveMatches: mappedLive.length ? mappedLive : matches.filter((m) => m.status === "live"),
      upcomingMatches: mappedUpcoming.length ? mappedUpcoming : matches.filter((m) => m.status === "upcoming").slice(0, 3),
      finishedMatches: mappedFinished.length ? mappedFinished : matches.filter((m) => m.status === "finished").slice(0, 3),
      recentNews: mappedNews.length ? mappedNews : newsPosts.slice(0, 3),
      featuredTableRows: sampleTable,
      featuredCompetitionName: "Akure South & North",
      topScorers: getTopScorers(5),
      activeCompetitionCount: dbCompetitions.length || competitions.filter((c) => c.status === "active").length,
      currentSeasonLabel: currentSeasonDb?.label ?? currentSeason.label,
    };
  } catch {
    return {
      liveMatches: matches.filter((m) => m.status === "live"),
      upcomingMatches: matches.filter((m) => m.status === "upcoming").slice(0, 3),
      finishedMatches: matches.filter((m) => m.status === "finished").slice(0, 3),
      recentNews: newsPosts.slice(0, 3),
      featuredTableRows: sampleTable,
      featuredCompetitionName: "Akure South & North",
      topScorers: getTopScorers(5),
      activeCompetitionCount: competitions.filter((c) => c.status === "active").length,
      currentSeasonLabel: currentSeason.label,
    };
  }
}

// ─── 2. COMPETITIONS DATA ───────────────────────────────────────────────────

export async function getPublicCompetitions() {
  if (!hasDatabaseConfig()) {
    return competitions.map((c) => {
      const rows = getTableRows(c.id);
      return {
        ...c,
        leaderName: rows[0]?.name ?? "Not started",
      };
    });
  }

  try {
    const prisma = getPrismaClient();
    const dbCompetitions = await prisma.competition.findMany({
      include: {
        _count: { select: { teams: true, matches: true } },
      },
      orderBy: { name: "asc" },
    });

    if (!dbCompetitions.length) {
      return competitions.map((c) => ({
        ...c,
        leaderName: getTableRows(c.id)[0]?.name ?? "Not started",
      }));
    }

    return dbCompetitions.map((c) => ({
      id: c.id,
      seasonId: c.seasonId,
      slug: c.slug,
      name: c.name,
      type: c.type as any,
      status: c.status.toLowerCase() as any,
      plannedTeams: c.plannedTeamCount,
      potCount: c.potCount,
      qualifiers: c.qualifiersCount,
      knockoutStart: c.knockoutStartRound,
      description: c.description,
      leaderName: "In progress",
    }));
  } catch {
    return competitions.map((c) => ({
      ...c,
      leaderName: getTableRows(c.id)[0]?.name ?? "Not started",
    }));
  }
}

// ─── 3. COMPETITION DETAIL ──────────────────────────────────────────────────

const KNOCKOUT_STAGES = new Set(["round-of-16", "quarter-final", "semi-final", "third-place", "final"]);

const STAGE_ORDER: Record<string, number> = {
  "round-of-16": 1,
  "quarter-final": 2,
  "semi-final": 3,
  "third-place": 4,
  "final": 5,
};

function buildKnockoutMatches(competitionId: string): BracketMatch[] {
  const compMatches = getMatchesForCompetition(competitionId).filter((m) =>
    KNOCKOUT_STAGES.has(m.stage)
  );

  // Group by stage and assign match numbers
  const grouped: Record<string, Match[]> = {};
  for (const m of compMatches) {
    if (!grouped[m.stage]) grouped[m.stage] = [];
    grouped[m.stage].push(m);
  }

  const result: BracketMatch[] = [];
  for (const stage of Object.keys(grouped).sort(
    (a, b) => (STAGE_ORDER[a] ?? 99) - (STAGE_ORDER[b] ?? 99)
  )) {
    grouped[stage].forEach((m, idx) => {
      const home = getTeamById(m.homeTeamId);
      const away = getTeamById(m.awayTeamId);
      result.push({
        id: m.id,
        slug: m.slug,
        stage,
        matchNumber: idx + 1,
        home: home
          ? { id: home.id, name: home.name, shortName: home.shortName, logo: home.logo }
          : null,
        away: away
          ? { id: away.id, name: away.name, shortName: away.shortName, logo: away.logo }
          : null,
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
        penalties: m.penalties ? { home: m.penalties.home, away: m.penalties.away } : null,
        status: m.status,
      });
    });
  }
  return result;
}

export async function getPublicCompetitionDetail(slug: string) {
  const fallbackComp = getCompetitionBySlug(slug);

  if (!hasDatabaseConfig() || !fallbackComp) {
    if (!fallbackComp) return null;
    const knockoutMatches = buildKnockoutMatches(fallbackComp.id);
    return {
      competition: fallbackComp,
      tableRows: getTableRows(fallbackComp.id),
      teams: getTeamsForCompetition(fallbackComp.id),
      matches: getMatchesForCompetition(fallbackComp.id),
      news: newsPosts.filter((post) => post.competitionId === fallbackComp.id),
      knockoutMatches,
      hasKnockout: knockoutMatches.length > 0,
    };
  }

  try {
    const prisma = getPrismaClient();
    const dbComp = await prisma.competition.findFirst({
      where: { slug },
      include: {
        teams: {
          include: {
            teamSeason: { include: { team: true } },
          },
        },
        matches: {
          include: {
            venue: true,
            homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
            awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
          },
          orderBy: { kickoffAt: "asc" },
        },
        newsPosts: {
          orderBy: { publishDate: "desc" },
        },
        standings: {
          include: {
            competitionTeam: { include: { teamSeason: { include: { team: true } } } },
          },
          orderBy: { rank: "asc" },
        },
      },
    });

    if (!dbComp) {
      return {
        competition: fallbackComp,
        tableRows: getTableRows(fallbackComp.id),
        teams: getTeamsForCompetition(fallbackComp.id),
        matches: getMatchesForCompetition(fallbackComp.id),
        news: newsPosts.filter((post) => post.competitionId === fallbackComp.id),
      };
    }

    const knockoutMatches = buildKnockoutMatches(fallbackComp.id);
    return {
      competition: {
        id: dbComp.id,
        seasonId: dbComp.seasonId,
        slug: dbComp.slug,
        name: dbComp.name,
        type: dbComp.type as any,
        status: dbComp.status.toLowerCase() as any,
        plannedTeams: dbComp.plannedTeamCount,
        potCount: dbComp.potCount,
        qualifiers: dbComp.qualifiersCount,
        knockoutStart: dbComp.knockoutStartRound,
        description: dbComp.description,
      },
      tableRows: getTableRows(fallbackComp.id),
      teams: getTeamsForCompetition(fallbackComp.id),
      matches: getMatchesForCompetition(fallbackComp.id),
      news: newsPosts.filter((post) => post.competitionId === fallbackComp.id),
      knockoutMatches,
      hasKnockout: knockoutMatches.length > 0,
    };
  } catch {
    const knockoutMatches = buildKnockoutMatches(fallbackComp.id);
    return {
      competition: fallbackComp,
      tableRows: getTableRows(fallbackComp.id),
      teams: getTeamsForCompetition(fallbackComp.id),
      matches: getMatchesForCompetition(fallbackComp.id),
      news: newsPosts.filter((post) => post.competitionId === fallbackComp.id),
      knockoutMatches,
      hasKnockout: knockoutMatches.length > 0,
    };
  }
}

// ─── 4. TEAMS DATA ───────────────────────────────────────────────────────────

export async function getPublicTeamsData(filters?: { competition?: string; season?: string }) {
  const selectedCompetition = filters?.competition ?? "all";
  const visibleTeams =
    selectedCompetition === "all"
      ? teams
      : teams.filter((team) => team.competitionIds.includes(selectedCompetition));

  return {
    teams: visibleTeams,
    seasonsList: seasons,
    competitionsList: competitions,
    topTeam: [...visibleTeams].sort((a, b) => b.points - a.points)[0] ?? null,
    totalGoals: visibleTeams.reduce((sum, team) => sum + team.goalsFor, 0),
    selectedCompetitionName:
      selectedCompetition === "all"
        ? "All competitions"
        : getCompetitionById(selectedCompetition)?.name ?? "All competitions",
  };
}

export async function getPublicTeamDetail(slug: string) {
  const team = getTeamBySlug(slug);
  if (!team) return null;

  const squad = getPlayersForTeam(team.id);
  const teamMatches = getMatchesForTeam(team.id);

  return {
    team,
    squad,
    matches: teamMatches,
  };
}

// ─── 5. PLAYERS DATA ─────────────────────────────────────────────────────────

export async function getPublicPlayersData(filters?: {
  competition?: string;
  season?: string;
  team?: string;
  position?: string;
}) {
  const selectedCompetition = filters?.competition ?? "all";
  const selectedTeam = filters?.team ?? "all";
  const selectedPosition = filters?.position ?? "all";

  const visiblePlayers = players.filter((player) => {
    const team = getTeamById(player.teamId);
    const competitionMatch =
      selectedCompetition === "all" || team?.competitionIds.includes(selectedCompetition);
    const teamMatch = selectedTeam === "all" || player.teamId === selectedTeam;
    const positionMatch = selectedPosition === "all" || player.positionGroup === selectedPosition;

    return competitionMatch && teamMatch && positionMatch;
  });

  return {
    players: visiblePlayers,
    seasonsList: seasons,
    competitionsList: competitions,
    teamsList: teams,
  };
}

export async function getPublicPlayerDetail(slug: string) {
  const player = getPlayerBySlug(slug);
  if (!player) return null;

  const team = getTeamById(player.teamId);
  const teamMatches = getMatchesForTeam(player.teamId).slice(0, 3);

  return {
    player,
    team,
    matches: teamMatches,
  };
}

// ─── 6. FIXTURES & MATCHES DATA ─────────────────────────────────────────────

export async function getPublicFixturesData(filters?: {
  competition?: string;
  season?: string;
  status?: string;
  team?: string;
  matchday?: string;
}) {
  const selectedStatus = filters?.status ?? "all";
  const selectedCompetition = filters?.competition ?? "all";
  const selectedTeam = filters?.team ?? "all";
  const selectedMatchday = filters?.matchday ?? "all";

  const matchdays = Array.from(new Set(matches.map((m) => m.matchday)));
  const filteredMatches = matches.filter((match) => {
    const statusMatch = selectedStatus === "all" || match.status === selectedStatus;
    const competitionMatch =
      selectedCompetition === "all" || match.competitionId === selectedCompetition;
    const teamMatch =
      selectedTeam === "all" || match.homeTeamId === selectedTeam || match.awayTeamId === selectedTeam;
    const matchdayMatch = selectedMatchday === "all" || match.matchday === selectedMatchday;

    return statusMatch && competitionMatch && teamMatch && matchdayMatch;
  });

  return {
    matches: filteredMatches,
    seasonsList: seasons,
    competitionsList: competitions,
    teamsList: teams,
    matchdays,
  };
}

export async function getPublicMatchDetail(slug: string) {
  const match = getMatchBySlug(slug);
  if (!match) return null;

  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  const competition = getCompetitionById(match.competitionId);
  const venue = getVenueById(match.venueId);

  if (!homeTeam || !awayTeam || !competition || !venue) return null;

  const homePlayers = getPlayersForTeam(homeTeam.id);
  const awayPlayers = getPlayersForTeam(awayTeam.id);

  // Build a quick id→name map for event resolution
  const allMatchPlayers = [...homePlayers, ...awayPlayers];
  const playerMap = Object.fromEntries(
    allMatchPlayers.map((p) => [p.id, { name: p.name, number: p.number }])
  );

  // Resolve player names on each event so the page doesn't need to do it
  const enrichedEvents = match.events.map((evt) => ({
    ...evt,
    playerName: playerMap[evt.playerId]?.name ?? evt.playerId,
    playerNumber: playerMap[evt.playerId]?.number ?? null,
    assistPlayerName: evt.assistPlayerId
      ? (playerMap[evt.assistPlayerId]?.name ?? evt.assistPlayerId)
      : null,
  }));

  // Resolve player name on each penalty attempt
  const enrichedAttempts = (match.penalties?.attempts ?? []).map((a) => ({
    ...a,
    playerName: playerMap[a.playerId]?.name ?? a.playerId,
    teamName: a.teamId === homeTeam.id ? homeTeam.shortName : awayTeam.shortName,
  }));

  return {
    match,
    homeTeam,
    awayTeam,
    competition,
    venue,
    homePlayers,
    awayPlayers,
    enrichedEvents,
    enrichedAttempts,
  };
}


// ─── 7. NEWS DATA ───────────────────────────────────────────────────────────

export async function getPublicNewsData(filters?: { competition?: string; season?: string }) {
  const selectedCompetition = filters?.competition ?? "all";
  const visiblePosts =
    selectedCompetition === "all"
      ? newsPosts
      : newsPosts.filter((post) => post.competitionId === selectedCompetition);

  return {
    posts: visiblePosts,
    seasonsList: seasons,
    competitionsList: competitions,
  };
}

export async function getPublicNewsDetail(slug: string) {
  const post = getNewsPostBySlug(slug);
  if (!post) return null;

  const competition = getCompetitionById(post.competitionId);
  return {
    post,
    competition,
  };
}

// ─── 8. TABLES & STATISTICS DATA ────────────────────────────────────────────

export async function getPublicTablesData(filters?: { competition?: string; season?: string }) {
  const competitionId = filters?.competition ?? competitions[0].id;
  const selectedCompetition = getCompetitionById(competitionId) ?? competitions[0];
  const tableRows = getTableRows(selectedCompetition.id);

  return {
    selectedCompetition,
    tableRows,
    seasonsList: seasons,
    competitionsList: competitions,
  };
}

export async function getPublicStatisticsData(filters?: { competition?: string; season?: string }) {
  const selectedCompetition = filters?.competition ?? "all";

  const inCompetition = (teamId: string) => {
    const team = getTeamById(teamId);
    return selectedCompetition === "all" || team?.competitionIds.includes(selectedCompetition);
  };

  const scorers = getTopScorers().filter((p) => inCompetition(p.teamId));
  const assists = getAssistLeaders().filter((p) => inCompetition(p.teamId));
  const cleanSheets = getCleanSheetLeaders().filter((p) => inCompetition(p.teamId));

  return {
    scorers,
    assists,
    cleanSheets,
    seasonsList: seasons,
    competitionsList: competitions,
  };
}

// ─── 9. GALLERIES DATA ──────────────────────────────────────────────────────

export async function getPublicGalleryData(filters?: {
  competition?: string;
  season?: string;
  scope?: string;
}) {
  const selectedCompetition = filters?.competition ?? "all";
  const selectedScope = filters?.scope ?? "all";

  const scopes = Array.from(new Set(galleryItems.map((item) => item.scope)));
  const visibleItems = galleryItems.filter((item) => {
    const competitionMatch =
      selectedCompetition === "all" || item.competitionId === selectedCompetition;
    const scopeMatch = selectedScope === "all" || item.scope === selectedScope;

    return competitionMatch && scopeMatch;
  });

  return {
    items: visibleItems,
    scopes,
    seasonsList: seasons,
    competitionsList: competitions,
  };
}

// ─── 10. AWARDS DATA ────────────────────────────────────────────────────────

export async function getPublicAwardsData(filters?: { competition?: string; season?: string }) {
  const selectedCompetition = filters?.competition ?? "all";
  const selectedSeason = filters?.season ?? seasons[0].id;

  const visibleRecords = awardsRecords.filter((record) => {
    const seasonMatch = record.seasonId === selectedSeason;
    const competitionMatch =
      selectedCompetition === "all" || record.competitionId === selectedCompetition;

    return seasonMatch && competitionMatch;
  });

  return {
    records: visibleRecords,
    seasonsList: seasons,
    competitionsList: competitions,
    selectedSeason,
    selectedCompetition,
  };
}

// ─── 11. VENUES DATA ────────────────────────────────────────────────────────

export async function getPublicVenuesData() {
  return venues.map((venue) => {
    const venueMatches = matches.filter((match) => match.venueId === venue.id);
    return {
      ...venue,
      matchCount: venueMatches.length,
    };
  });
}

// ─── 12. SEARCH DATA ────────────────────────────────────────────────────────

export async function getPublicSearchData(queryStr?: string) {
  const q = (queryStr ?? "").trim().toLowerCase();

  const teamResults = q
    ? teams.filter((t) => t.name.toLowerCase().includes(q) || t.community.toLowerCase().includes(q))
    : teams.slice(0, 4);

  const playerResults = q
    ? players.filter((p) => p.name.toLowerCase().includes(q))
    : players.slice(0, 4);

  const newsResults = q
    ? newsPosts.filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q))
    : newsPosts.slice(0, 3);

  const matchResults = q
    ? matches.filter((m) => {
        const home = getTeamById(m.homeTeamId)?.name.toLowerCase() ?? "";
        const away = getTeamById(m.awayTeamId)?.name.toLowerCase() ?? "";
        return home.includes(q) || away.includes(q) || m.matchday.toLowerCase().includes(q);
      })
    : matches.slice(0, 4);

  return {
    q,
    teamResults,
    playerResults,
    newsResults,
    matchResults,
  };
}

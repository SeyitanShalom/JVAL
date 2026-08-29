import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */

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
  type EventType,
  type GalleryItem,
  type Match,
  type MatchEvent,
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
  minute?: string | null;
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

export type PublicVenueItem = {
  id: string;
  name: string;
  location: string;
  matchCount: number;
};

export type PublicCompetitionItem = Competition & {
  leaderName: string;
};

// ─── HELPER: MAP PRISMA MATCH TO PUBLIC MATCH ────────────────────────────────

function mapPrismaEventType(e: any): EventType {
  const eType = (e.type || "").toUpperCase();
  const note = (e.note || "").toLowerCase();

  if (eType === "GOAL") return "Goal";
  if (eType === "ASSIST") return "Assist";
  if (eType === "YELLOW_CARD") return "Yellow card";
  if (eType === "RED_CARD") return "Red card";
  if (eType === "SUBSTITUTION") return "Substitution";
  if (eType === "PENALTY_SCORED") return "Penalty scored";
  if (eType === "PENALTY_MISSED") return "Penalty missed";
  if (eType === "OWN_GOAL") return "Own goal";
  if (eType === "NOTE" && note.includes("disallowed goal")) return "Disallowed goal";
  return "Note";
}

export function mapPrismaMatchToPublicMatch(m: any): Match {
  const homeTeam = m.homeCompetitionTeam?.teamSeason?.team;
  const awayTeam = m.awayCompetitionTeam?.teamSeason?.team;
  const statusStr = (m.status || "").toUpperCase();
  const status: Match["status"] =
    statusStr === "LIVE" || statusStr === "HALFTIME" || statusStr === "PENALTIES"
      ? "live"
      : statusStr === "FULLTIME"
      ? "finished"
      : statusStr === "POSTPONED"
      ? "postponed"
      : "upcoming";

  const homeTeamId = homeTeam?.id || m.homeCompetitionTeamId || m.homeSourceLabel || "tbd-home";
  const awayTeamId = awayTeam?.id || m.awayCompetitionTeamId || m.awaySourceLabel || "tbd-away";
  const competitionId = m.competition?.id || m.competitionId;
  const venueId = m.venue?.id || m.venueId;

  const events: MatchEvent[] = (m.events || []).map((e: any) => {
    const type = mapPrismaEventType(e);

    const eventTeamId =
      e.competitionTeam?.teamSeason?.team?.id ||
      (e.competitionTeamId === m.homeCompetitionTeamId ? homeTeamId : awayTeamId) ||
      "";
    const teamId =
      type === "Own goal" && eventTeamId === homeTeamId
        ? awayTeamId
        : type === "Own goal" && eventTeamId === awayTeamId
        ? homeTeamId
        : eventTeamId;

    return {
      id: e.id,
      minute: e.minuteLabel || (e.minute ? e.minute + "'" : "0'"),
      type,
      teamId,
      playerId: e.player?.player?.fullName || e.player?.player?.id || e.playerId || "",
      assistPlayerId: e.assistPlayer?.player?.fullName || e.assistPlayer?.player?.id || e.assistPlayerId || undefined,
    };
  });

  const penaltyAttempts = (m.penaltyAttempts || []).map((p: any, idx: number) => {
    const teamId =
      p.competitionTeam?.teamSeason?.team?.id ||
      (p.competitionTeamId === m.homeCompetitionTeamId ? homeTeamId : awayTeamId) ||
      "";
    return {
      id: p.id,
      order: p.sequence || idx + 1,
      teamId,
      playerId: p.taker?.player?.fullName || p.taker?.player?.id || p.takerId || "",
      scored: Boolean(p.scored),
    };
  });

  const penalties =
    m.homePenaltyScore !== null && m.awayPenaltyScore !== null
      ? {
          home: m.homePenaltyScore,
          away: m.awayPenaltyScore,
          attempts: penaltyAttempts,
        }
      : undefined;

  return {
    id: m.id,
    slug: m.slug,
    seasonId: m.seasonId || "2026-2027",
    competitionId,
    competitionName: m.competition?.name,
    matchday: m.matchday || "Matchday 1",
    stage: m.stage ? (m.stage.toLowerCase().replace(/_/g, "-") as any) : "group",
    status,
    minute: m.minuteLabel || (status === "live" ? "1'" : undefined),
    currentPeriod: m.currentPeriod ?? undefined,
    date: m.kickoffAt ? new Date(m.kickoffAt).toISOString() : new Date().toISOString(),
    venueId,
    venueName: m.venue?.name,
    venueLocation: m.venue?.location,
    homeTeamId,
    homeTeamName: homeTeam?.name || m.homeSourceLabel || "TBD",
    homeTeamShort: homeTeam?.shortName || "TBD",
    homeTeamLogo: homeTeam?.logoUrl || "/football club.png",
    awayTeamId,
    awayTeamName: awayTeam?.name || m.awaySourceLabel || "TBD",
    awayTeamShort: awayTeam?.shortName || "TBD",
    awayTeamLogo: awayTeam?.logoUrl || "/football club.png",
    homeScore: m.homeScore ?? undefined,
    awayScore: m.awayScore ?? undefined,
    penalties,
    referee: m.referee || undefined,
    firstHalfStartedAt: m.firstHalfStartedAt ? new Date(m.firstHalfStartedAt).toISOString() : undefined,
    secondHalfStartedAt: m.secondHalfStartedAt ? new Date(m.secondHalfStartedAt).toISOString() : undefined,
    formationHome: m.formationHome || "4-3-3",
    formationAway: m.formationAway || "4-3-3",
    events,
  };
}

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
        where: { status: { in: ["LIVE", "HALFTIME", "PENALTIES"] as any } },
        orderBy: { kickoffAt: "asc" },
        take: 6,
        include: {
          competition: true,
          venue: true,
          homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
          awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
          events: true,
          penaltyAttempts: { include: { taker: { include: { player: true } } } },
        },
      }),
      prisma.match.findMany({
        where: { status: "UPCOMING" },
        orderBy: { kickoffAt: "asc" },
        take: 6,
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
        take: 6,
        include: {
          competition: true,
          venue: true,
          homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
          awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
          events: true,
          penaltyAttempts: { include: { taker: { include: { player: true } } } },
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

    const mappedLive = dbLiveMatches.map(mapPrismaMatchToPublicMatch);
    const mappedUpcoming = dbUpcomingMatches.map(mapPrismaMatchToPublicMatch);
    const mappedFinished = dbFinishedMatches.map(mapPrismaMatchToPublicMatch);

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
      liveMatches: mappedLive,
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

export async function getPublicCompetitions(): Promise<PublicCompetitionItem[]> {
  if (!hasDatabaseConfig()) {
    return competitions.map((c) => ({
      ...c,
      leaderName: getTableRows(c.id)[0]?.name ?? "Not started",
    }));
  }

  try {
    const prisma = getPrismaClient();
    const dbCompetitions = await prisma.competition.findMany({
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
      type: (c.type === "SUPER_CUP" ? "Super Cup" : "Local Government") as "Local Government" | "Super Cup",
      status: (c.status === "ACTIVE" ? "active" : c.status === "COMPLETED" ? "completed" : "upcoming") as "upcoming" | "active" | "completed",
      plannedTeams: c.plannedTeamCount,
      potCount: c.potCount,
      qualifiers: c.qualifiersCount,
      knockoutStart: (c.knockoutStartRound === "ROUND_OF_16" ? "Round of 16" : "Quarter-final") as "Quarter-final" | "Round of 16",
      description: c.description,
      leaderName: getTableRows(c.slug)[0]?.name ?? getTableRows(c.id)[0]?.name ?? "In progress",
    }));
  } catch {
    return competitions.map((c) => ({
      ...c,
      leaderName: getTableRows(c.id)[0]?.name ?? "Not started",
    }));
  }
}

// ─── 3. KNOCKOUT BRACKET BUILDER ─────────────────────────────────────────────

const STAGE_ORDER: Record<string, number> = {
  "round-of-16": 1,
  "quarter-final": 2,
  "semi-final": 3,
  "third-place": 4,
  final: 5,
};

export function buildKnockoutMatches(competitionId: string): BracketMatch[] {
  const compMatches = matches.filter(
    (m) =>
      m.competitionId === competitionId &&
      m.stage !== "group" &&
      STAGE_ORDER[m.stage] !== undefined
  );

  if (compMatches.length === 0) return [];

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
        minute: m.minute ?? null,
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
      where: { OR: [{ slug }, { id: slug }] },
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
            events: true,
            penaltyAttempts: { include: { taker: { include: { player: true } } } },
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
        knockoutMatches: [],
        hasKnockout: false,
      };
    }

    const mappedMatches = dbComp.matches.map(mapPrismaMatchToPublicMatch);

    const compKnockoutMatches: BracketMatch[] = mappedMatches
      .filter((m) => m.stage !== "group" && STAGE_ORDER[m.stage] !== undefined)
      .map((m, idx) => {
        const fallbackHome = getTeamById(m.homeTeamId);
        const fallbackAway = getTeamById(m.awayTeamId);
        return {
          id: m.id,
          slug: m.slug,
          stage: m.stage,
          matchNumber: idx + 1,
          home: {
            id: m.homeTeamId,
            name: m.homeTeamName ?? fallbackHome.name,
            shortName: m.homeTeamShort ?? fallbackHome.shortName,
            logo: m.homeTeamLogo ?? fallbackHome.logo,
          },
          away: {
            id: m.awayTeamId,
            name: m.awayTeamName ?? fallbackAway.name,
            shortName: m.awayTeamShort ?? fallbackAway.shortName,
            logo: m.awayTeamLogo ?? fallbackAway.logo,
          },
          homeScore: m.homeScore ?? null,
          awayScore: m.awayScore ?? null,
          penalties: m.penalties ? { home: m.penalties.home, away: m.penalties.away } : null,
          status: m.status,
          minute: m.minute ?? null,
        };
      });

    return {
      competition: {
        id: dbComp.id,
        seasonId: dbComp.seasonId,
        slug: dbComp.slug,
        name: dbComp.name,
        type: (dbComp.type === "SUPER_CUP" ? "Super Cup" : "Local Government") as "Local Government" | "Super Cup",
        status: (dbComp.status === "ACTIVE" ? "active" : dbComp.status === "COMPLETED" ? "completed" : "upcoming") as "upcoming" | "active" | "completed",
        plannedTeams: dbComp.plannedTeamCount,
        potCount: dbComp.potCount,
        qualifiers: dbComp.qualifiersCount,
        knockoutStart: (dbComp.knockoutStartRound === "ROUND_OF_16" ? "Round of 16" : "Quarter-final") as "Quarter-final" | "Round of 16",
        description: dbComp.description,
      },
      tableRows: getTableRows(fallbackComp.id),
      teams: getTeamsForCompetition(fallbackComp.id),
      matches: mappedMatches.length ? mappedMatches : getMatchesForCompetition(fallbackComp.id),
      news: newsPosts.filter((post) => post.competitionId === fallbackComp.id),
      knockoutMatches: compKnockoutMatches.length ? compKnockoutMatches : buildKnockoutMatches(fallbackComp.id),
      hasKnockout: compKnockoutMatches.length > 0 || buildKnockoutMatches(fallbackComp.id).length > 0,
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

  const teamPlayers = getPlayersForTeam(team.id);
  const teamMatches = getMatchesForTeam(team.id);
  const teamCompetitions = team.competitionIds
    .map((id) => getCompetitionById(id))
    .filter(Boolean) as Competition[];

  return {
    team,
    players: teamPlayers,
    squad: teamPlayers,
    matches: teamMatches,
    competitions: teamCompetitions,
  };
}

// ─── 5. PLAYERS DATA ─────────────────────────────────────────────────────────

export async function getPublicPlayersData(filters?: {
  competition?: string;
  team?: string;
  position?: string;
  season?: string;
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
    teamsList: teams,
    competitionsList: competitions,
    seasonsList: seasons,
    positionsList: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
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
  const selectedSeason = filters?.season ?? "all";
  const selectedTeam = filters?.team ?? "all";
  const selectedMatchday = filters?.matchday ?? "all";

  if (hasDatabaseConfig()) {
    try {
      const prisma = getPrismaClient();
      const [dbMatches, dbCompetitions, dbSeasons, dbTeams] = await Promise.all([
        prisma.match.findMany({
          include: {
            competition: true,
            venue: true,
            homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
            awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
            events: true,
            penaltyAttempts: { include: { taker: { include: { player: true } } } },
          },
          orderBy: { kickoffAt: "asc" },
        }),
        prisma.competition.findMany({ orderBy: { name: "asc" } }),
        prisma.season.findMany({ orderBy: { startsAt: "desc" } }),
        prisma.team.findMany({ orderBy: { name: "asc" } }),
      ]);

      if (dbMatches.length > 0) {
        const mappedMatches = dbMatches.map(mapPrismaMatchToPublicMatch);

        const filtered = mappedMatches.filter((match) => {
          const statusMatch = selectedStatus === "all" || match.status === selectedStatus;
          const seasonMatch = selectedSeason === "all" || match.seasonId === selectedSeason;
          const competitionMatch =
            selectedCompetition === "all" || match.competitionId === selectedCompetition;
          const teamMatch =
            selectedTeam === "all" ||
            match.homeTeamId === selectedTeam ||
            match.awayTeamId === selectedTeam;
          const matchdayMatch = selectedMatchday === "all" || match.matchday === selectedMatchday;

          return statusMatch && seasonMatch && competitionMatch && teamMatch && matchdayMatch;
        });

        const matchdays = Array.from(new Set(mappedMatches.map((m) => m.matchday)));

        const mappedCompetitions: Competition[] = dbCompetitions.map((c) => ({
          id: c.id,
          slug: c.slug,
          seasonId: c.seasonId,
          name: c.name,
          type: (c.type === "SUPER_CUP" ? "Super Cup" : "Local Government") as "Local Government" | "Super Cup",
          status: (c.status === "ACTIVE" ? "active" : c.status === "COMPLETED" ? "completed" : "upcoming") as "upcoming" | "active" | "completed",
          plannedTeams: c.plannedTeamCount,
          potCount: c.potCount,
          qualifiers: c.qualifiersCount,
          knockoutStart: (c.knockoutStartRound === "ROUND_OF_16" ? "Round of 16" : "Quarter-final") as "Quarter-final" | "Round of 16",
          description: c.description,
        }));

        const mappedTeams: Team[] = dbTeams.map((t) => ({
          id: t.id,
          slug: t.slug,
          seasonId: dbSeasons[0]?.id || "2026-2027",
          competitionIds: [],
          name: t.name,
          shortName: t.shortName,
          logo: t.logoUrl || "/football club.png",
          community: t.community || "Akure",
          coach: "Coach",
          captain: "Captain",
          pot: 1,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          form: [],
        }));

        const mappedSeasons: Season[] = dbSeasons.map((s) => ({
          id: s.id,
          label: s.label,
          status: s.isCurrent ? "active" : "upcoming",
        }));

        return {
          matches: filtered,
          seasonsList: mappedSeasons.length ? mappedSeasons : seasons,
          competitionsList: mappedCompetitions.length ? mappedCompetitions : competitions,
          teamsList: mappedTeams.length ? mappedTeams : teams,
          matchdays: matchdays.length ? matchdays : Array.from(new Set(matches.map((m) => m.matchday))),
          hasLiveMatches: mappedMatches.some((m) => m.status === "live"),
        };
      }
    } catch (e) {
      console.error("Failed to query DB fixtures, falling back to mock:", e);
    }
  }

  // Fallback to sample
  const matchdays = Array.from(new Set(matches.map((m) => m.matchday)));
  const filteredMatches = matches.filter((match) => {
    const statusMatch = selectedStatus === "all" || match.status === selectedStatus;
    const seasonMatch = selectedSeason === "all" || match.seasonId === selectedSeason;
    const competitionMatch =
      selectedCompetition === "all" || match.competitionId === selectedCompetition;
    const teamMatch =
      selectedTeam === "all" || match.homeTeamId === selectedTeam || match.awayTeamId === selectedTeam;
    const matchdayMatch = selectedMatchday === "all" || match.matchday === selectedMatchday;

    return statusMatch && seasonMatch && competitionMatch && teamMatch && matchdayMatch;
  });

  return {
    matches: filteredMatches,
    seasonsList: seasons,
    competitionsList: competitions,
    teamsList: teams,
    matchdays,
    hasLiveMatches: matches.some((m) => m.status === "live"),
  };
}

export async function getPublicMatchDetail(slug: string) {
  if (hasDatabaseConfig()) {
    try {
      const prisma = getPrismaClient();
      const dbMatch = await prisma.match.findFirst({
        where: { slug },
        include: {
          competition: true,
          venue: true,
          homeCompetitionTeam: {
            include: {
              teamSeason: {
                include: {
                  team: true,
                  squadPlayers: {
                    include: { player: true },
                    orderBy: { squadNumber: "asc" },
                  },
                },
              },
            },
          },
          awayCompetitionTeam: {
            include: {
              teamSeason: {
                include: {
                  team: true,
                  squadPlayers: {
                    include: { player: true },
                    orderBy: { squadNumber: "asc" },
                  },
                },
              },
            },
          },
          events: {
            include: {
              competitionTeam: { include: { teamSeason: { include: { team: true } } } },
              player: { include: { player: true } },
              assistPlayer: { include: { player: true } },
              playerIn: { include: { player: true } },
              playerOut: { include: { player: true } },
            },
            orderBy: [{ minute: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
          },
          penaltyAttempts: {
            include: {
              competitionTeam: { include: { teamSeason: { include: { team: true } } } },
              taker: { include: { player: true } },
            },
            orderBy: { sequence: "asc" },
          },
        },
      });

      if (dbMatch) {
        const homeTs = dbMatch.homeCompetitionTeam?.teamSeason;
        const awayTs = dbMatch.awayCompetitionTeam?.teamSeason;
        const homeTeamRaw = homeTs?.team;
        const awayTeamRaw = awayTs?.team;

        const homeTeam: Team = homeTeamRaw
          ? {
              id: homeTeamRaw.id,
              slug: homeTeamRaw.slug,
              seasonId: dbMatch.seasonId,
              competitionIds: [dbMatch.competitionId],
              name: homeTeamRaw.name,
              shortName: homeTeamRaw.shortName,
              logo: homeTeamRaw.logoUrl || "/football club.png",
              community: homeTeamRaw.community || "Akure",
              coach: homeTs?.coachName || "Head Coach",
              captain: homeTs?.captainName || "Team Captain",
              pot: 1,
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              points: 0,
              form: [],
            }
          : getTeamById(dbMatch.homeSourceLabel || "oyemekun");

        const awayTeam: Team = awayTeamRaw
          ? {
              id: awayTeamRaw.id,
              slug: awayTeamRaw.slug,
              seasonId: dbMatch.seasonId,
              competitionIds: [dbMatch.competitionId],
              name: awayTeamRaw.name,
              shortName: awayTeamRaw.shortName,
              logo: awayTeamRaw.logoUrl || "/football club.png",
              community: awayTeamRaw.community || "Akure",
              coach: awayTs?.coachName || "Head Coach",
              captain: awayTs?.captainName || "Team Captain",
              pot: 1,
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              points: 0,
              form: [],
            }
          : getTeamById(dbMatch.awaySourceLabel || "aquinas");

        const competition: Competition = {
          id: dbMatch.competition.id,
          slug: dbMatch.competition.slug,
          seasonId: dbMatch.competition.seasonId,
          name: dbMatch.competition.name,
          type: (dbMatch.competition.type === "SUPER_CUP" ? "Super Cup" : "Local Government") as "Local Government" | "Super Cup",
          status: (dbMatch.competition.status === "ACTIVE" ? "active" : dbMatch.competition.status === "COMPLETED" ? "completed" : "upcoming") as "upcoming" | "active" | "completed",
          plannedTeams: dbMatch.competition.plannedTeamCount,
          potCount: dbMatch.competition.potCount,
          qualifiers: dbMatch.competition.qualifiersCount,
          knockoutStart: (dbMatch.competition.knockoutStartRound === "ROUND_OF_16" ? "Round of 16" : "Quarter-final") as "Quarter-final" | "Round of 16",
          description: dbMatch.competition.description,
        };

        const venue: Venue = {
          id: dbMatch.venue.id,
          slug: dbMatch.venue.slug,
          name: dbMatch.venue.name,
          location: dbMatch.venue.location,
        };

        const mapSquadToPlayers = (sqs: any[], teamId: string): Player[] =>
          (sqs || []).map((sq) => ({
            id: sq.player.id,
            slug: sq.player.slug,
            teamId,
            name: sq.player.fullName,
            photo: sq.player.photoUrl || "/Profile.png",
            number: sq.squadNumber,
            positionGroup:
              sq.positionCategory === "GOALKEEPER"
                ? "Goalkeeper"
                : sq.positionCategory === "DEFENDER"
                ? "Defender"
                : sq.positionCategory === "MIDFIELDER"
                ? "Midfielder"
                : "Forward",
            detailedPosition: sq.detailedPosition || "MF",
            dateOfBirth: sq.player.dateOfBirth.toISOString().split("T")[0],
            appearances: 0,
            goals: 0,
            assists: 0,
            cleanSheets: 0,
            yellowCards: 0,
            redCards: 0,
          }));

        const homePlayers = mapSquadToPlayers(homeTs?.squadPlayers || [], homeTeam.id);
        const awayPlayers = mapSquadToPlayers(awayTs?.squadPlayers || [], awayTeam.id);

        const match = mapPrismaMatchToPublicMatch(dbMatch);

        const enrichedEvents = (dbMatch.events || []).map((e) => {
          const eventType = mapPrismaEventType(e);

          const eventTeamId =
            e.competitionTeamId === dbMatch.homeCompetitionTeamId
              ? homeTeam.id
              : e.competitionTeamId === dbMatch.awayCompetitionTeamId
              ? awayTeam.id
              : e.competitionTeam?.teamSeason?.team?.id || "";
          const evTeamId =
            eventType === "Own goal" && eventTeamId === homeTeam.id
              ? awayTeam.id
              : eventType === "Own goal" && eventTeamId === awayTeam.id
              ? homeTeam.id
              : eventTeamId;

          return {
            id: e.id,
            minute: e.minuteLabel || (e.minute ? e.minute + "'" : "0'"),
            type: eventType,
            teamId: evTeamId,
            playerId: e.player?.player?.id || e.playerId || "",
            playerName: e.player?.player?.fullName || "Player",
            playerNumber: e.player?.squadNumber ?? null,
            assistPlayerName: e.assistPlayer?.player?.fullName || null,
            playerInName: e.playerIn?.player?.fullName || null,
            playerOutName: e.playerOut?.player?.fullName || null,
            note: e.note || null,
          };
        });

        const enrichedAttempts = (dbMatch.penaltyAttempts || []).map((a) => {
          const attemptTeamId =
            a.competitionTeamId === dbMatch.homeCompetitionTeamId
              ? homeTeam.id
              : a.competitionTeamId === dbMatch.awayCompetitionTeamId
              ? awayTeam.id
              : a.competitionTeam?.teamSeason?.team?.id || "";
          const isHome = attemptTeamId === homeTeam.id;

          return {
            id: a.id,
            order: a.sequence,
            teamId: attemptTeamId,
            teamName: isHome ? homeTeam.shortName : awayTeam.shortName,
            playerId: a.taker?.player?.id || a.takerId,
            playerName: a.taker?.player?.fullName || "Taker",
            playerNumber: a.taker?.squadNumber ?? null,
            scored: a.scored,
          };
        });

        return {
          match,
          homeTeam,
          awayTeam,
          competition,
          venue,
          homePlayers: homePlayers.length ? homePlayers : getPlayersForTeam(homeTeam.id),
          awayPlayers: awayPlayers.length ? awayPlayers : getPlayersForTeam(awayTeam.id),
          enrichedEvents,
          enrichedAttempts,
        };
      }
    } catch (e) {
      console.error("Failed to load match from database, falling back to mock:", e);
    }
  }

  // Fallback to sample mock data
  const match = getMatchBySlug(slug);
  if (!match) return null;

  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  const competition = getCompetitionById(match.competitionId);
  const venue = getVenueById(match.venueId);

  if (!homeTeam || !awayTeam || !competition || !venue) return null;

  const homePlayers = getPlayersForTeam(homeTeam.id);
  const awayPlayers = getPlayersForTeam(awayTeam.id);

  const allMatchPlayers = [...homePlayers, ...awayPlayers];
  const playerMap = Object.fromEntries(
    allMatchPlayers.map((p) => [p.id, { name: p.name, number: p.number }])
  );

  const enrichedEvents = match.events.map((evt) => ({
    ...evt,
    playerName: playerMap[evt.playerId]?.name ?? evt.playerId,
    playerNumber: playerMap[evt.playerId]?.number ?? null,
    assistPlayerName: evt.assistPlayerId
      ? playerMap[evt.assistPlayerId]?.name ?? evt.assistPlayerId
      : null,
    playerInName: null,
    playerOutName: null,
    note: null,
  }));

  const enrichedAttempts = (match.penalties?.attempts ?? []).map((a) => ({
    ...a,
    playerName: playerMap[a.playerId]?.name ?? a.playerId,
    playerNumber: playerMap[a.playerId]?.number ?? null,
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

  if (hasDatabaseConfig()) {
    try {
      const prisma = getPrismaClient();
      const dbStandings = await prisma.competitionStanding.findMany({
        where: {
          competition: {
            OR: [{ id: competitionId }, { slug: competitionId }],
          },
        },
        include: {
          competitionTeam: {
            include: {
              teamSeason: {
                include: { team: true },
              },
            },
          },
        },
        orderBy: { rank: "asc" },
      });

      if (dbStandings.length > 0) {
        const tableRows: Team[] = dbStandings.map((s) => {
          const t = s.competitionTeam.teamSeason.team;
          return {
            id: t.id,
            slug: t.slug,
            seasonId: s.competitionTeam.teamSeason.seasonId,
            competitionIds: [s.competitionId],
            name: t.name,
            shortName: t.shortName,
            logo: t.logoUrl || "/football club.png",
            community: t.community || "Akure",
            coach: s.competitionTeam.teamSeason.coachName || "Coach",
            captain: s.competitionTeam.teamSeason.captainName || "Captain",
            pot: 1,
            played: s.played,
            wins: s.wins,
            draws: s.draws,
            losses: s.losses,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            points: s.points,
            form: (s.form || "")
              .split("")
              .filter((c): c is "W" | "D" | "L" => c === "W" || c === "D" || c === "L")
              .slice(-5),
          };
        });

        return {
          selectedCompetition,
          tableRows,
          seasonsList: seasons,
          competitionsList: competitions,
        };
      }
    } catch (e) {
      console.error("Failed to query DB standings:", e);
    }
  }

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

  if (hasDatabaseConfig()) {
    try {
      const prisma = getPrismaClient();
      const stats = await prisma.playerStat.findMany({
        where:
          selectedCompetition !== "all"
            ? {
                OR: [
                  { competitionId: selectedCompetition },
                  { competition: { slug: selectedCompetition } },
                ],
              }
            : undefined,
        include: {
          squadPlayer: {
            include: {
              player: true,
              teamSeason: { include: { team: true } },
            },
          },
        },
      });

      if (stats.length > 0) {
        const mapStatToPlayer = (s: any): Player => ({
          id: s.squadPlayer.player.id,
          slug: s.squadPlayer.player.slug,
          teamId: s.squadPlayer.teamSeason.team.id,
          name: s.squadPlayer.player.fullName,
          photo: s.squadPlayer.player.photoUrl || "/Profile.png",
          number: s.squadPlayer.squadNumber,
          positionGroup:
            s.squadPlayer.positionCategory === "GOALKEEPER"
              ? "Goalkeeper"
              : s.squadPlayer.positionCategory === "DEFENDER"
              ? "Defender"
              : s.squadPlayer.positionCategory === "MIDFIELDER"
              ? "Midfielder"
              : "Forward",
          detailedPosition: s.squadPlayer.detailedPosition || "MF",
          dateOfBirth: s.squadPlayer.player.dateOfBirth.toISOString().split("T")[0],
          appearances: s.appearances,
          goals: s.goals,
          assists: s.assists,
          cleanSheets: s.cleanSheets,
          yellowCards: s.yellowCards,
          redCards: s.redCards,
        });

        const allMapped = stats.map(mapStatToPlayer);
        const scorers = [...allMapped].sort((a, b) => b.goals - a.goals);
        const assists = [...allMapped].sort((a, b) => b.assists - a.assists);
        const cleanSheets = [...allMapped].sort((a, b) => b.cleanSheets - a.cleanSheets);

        return {
          scorers,
          assists,
          cleanSheets,
          seasonsList: seasons,
          competitionsList: competitions,
        };
      }
    } catch (e) {
      console.error("Failed to query DB player stats:", e);
    }
  }

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

// ─── 9. VENUES DATA ──────────────────────────────────────────────────────────

export async function getPublicVenuesData(): Promise<PublicVenueItem[]> {
  if (hasDatabaseConfig()) {
    try {
      const prisma = getPrismaClient();
      const dbVenues = await prisma.venue.findMany({
        include: {
          _count: { select: { matches: true } },
        },
        orderBy: { name: "asc" },
      });
      if (dbVenues.length > 0) {
        return dbVenues.map((v) => ({
          id: v.id,
          name: v.name,
          location: v.location,
          matchCount: v._count.matches,
        }));
      }
    } catch (e) {
      console.error("Failed to fetch venues from DB:", e);
    }
  }

  return venues.map((v) => ({
    id: v.id,
    name: v.name,
    location: v.location,
    matchCount: matches.filter((m) => m.venueId === v.id).length,
  }));
}

// ─── 10. GALLERIES DATA ─────────────────────────────────────────────────────

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

// ─── 11. AWARDS DATA ────────────────────────────────────────────────────────

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
    selectedSeason,
    selectedCompetition,
    seasonsList: seasons,
    competitionsList: competitions,
  };
}

// ─── 12. SEARCH DATA ────────────────────────────────────────────────────────

export async function getPublicSearchData(query?: string) {
  const q = (query || "").toLowerCase().trim();
  if (!q) {
    return {
      q: query ?? "",
      teamResults: [] as Team[],
      playerResults: [] as Player[],
      matchResults: [] as Match[],
      newsResults: [] as NewsPost[],
    };
  }

  const matchedTeams = teams.filter(
    (t) => t.name.toLowerCase().includes(q) || t.community.toLowerCase().includes(q)
  );

  const matchedPlayers = players.filter((p) => p.name.toLowerCase().includes(q));

  const matchedMatches = matches.filter((m) => {
    const h = getTeamById(m.homeTeamId)?.name.toLowerCase() || "";
    const a = getTeamById(m.awayTeamId)?.name.toLowerCase() || "";
    return h.includes(q) || a.includes(q);
  });

  const matchedPosts = newsPosts.filter(
    (p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)
  );

  return {
    q: query ?? "",
    teamResults: matchedTeams,
    playerResults: matchedPlayers,
    matchResults: matchedMatches,
    newsResults: matchedPosts,
  };
}

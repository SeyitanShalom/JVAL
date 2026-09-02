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

const PUBLIC_COMPETITION_CONTENT_WHERE = {
  OR: [
    { type: { not: "SUPER_CUP" } },
    { status: { in: ["ACTIVE", "COMPLETED"] } },
  ],
} as const;

function mapPrismaCompetitionToPublic(c: any): Competition {
  return {
    id: c.id,
    seasonId: c.seasonId,
    slug: c.slug,
    name: c.name,
    type: (c.type === "SUPER_CUP" ? "Super Cup" : "Local Government") as
      | "Local Government"
      | "Super Cup",
    status: (c.status === "ACTIVE"
      ? "active"
      : c.status === "COMPLETED"
        ? "completed"
        : "upcoming") as "upcoming" | "active" | "completed",
    plannedTeams: c.plannedTeamCount,
    potCount: c.potCount,
    qualifiers: c.qualifiersCount,
    knockoutStart: (c.knockoutStartRound === "ROUND_OF_16"
      ? "Round of 16"
      : "Quarter-final") as "Quarter-final" | "Round of 16",
    description: c.description,
  };
}

function isPendingSuperCup(
  competition?: Pick<Competition, "type" | "status"> | null,
) {
  return competition?.type === "Super Cup" && competition.status === "upcoming";
}

export function getPublicCompetitionFilterLabel(
  competition: Pick<Competition, "name" | "type" | "status">,
) {
  return isPendingSuperCup(competition)
    ? `${competition.name} (Pending)`
    : competition.name;
}

function shouldShowCompetitionContent(
  competition?: Pick<Competition, "type" | "status"> | null,
) {
  return competition?.type !== "Super Cup" || !isPendingSuperCup(competition);
}

function shouldShowCompetitionIdContent(competitionId?: string | null) {
  if (!competitionId) return true;

  const competition = competitions.find(
    (c) => c.id === competitionId || c.slug === competitionId,
  );

  return competition ? shouldShowCompetitionContent(competition) : true;
}

function getPublicMatches(source: Match[]) {
  return source.filter((match) =>
    shouldShowCompetitionIdContent(match.competitionId),
  );
}

function getPublicTeams(source: Team[]) {
  return source.filter((team) =>
    team.competitionIds.some(shouldShowCompetitionIdContent),
  );
}

function shouldShowPlayerContent(player: Player) {
  const team = teams.find((item) => item.id === player.teamId);

  return Boolean(team?.competitionIds.some(shouldShowCompetitionIdContent));
}

function getPublicPlayers(source: Player[]) {
  return source.filter(shouldShowPlayerContent);
}

function getPublicCompetitionLeaderName(competition: Competition) {
  if (isPendingSuperCup(competition)) {
    return "Pending qualifiers";
  }

  return getTableRows(competition.id)[0]?.name ?? "Not started";
}

export function getPublicTeamStaticParams() {
  return getPublicTeams(teams).map((team) => ({ slug: team.slug }));
}

export function getPublicPlayerStaticParams() {
  return getPublicPlayers(players).map((player) => ({ slug: player.slug }));
}

export function getPublicMatchStaticParams() {
  return getPublicMatches(matches).map((match) => ({ slug: match.slug }));
}

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
  if (eType === "NOTE" && note.includes("disallowed goal"))
    return "Disallowed goal";
  return "Note";
}

export function mapPrismaMatchToPublicMatch(m: any): Match {
  const homeTeam = m.homeCompetitionTeam?.teamSeason?.team;
  const awayTeam = m.awayCompetitionTeam?.teamSeason?.team;
  const statusStr = (m.status || "").toUpperCase();
  const status: Match["status"] =
    statusStr === "LIVE" ||
    statusStr === "HALFTIME" ||
    statusStr === "PENALTIES"
      ? "live"
      : statusStr === "FULLTIME"
        ? "finished"
        : statusStr === "POSTPONED"
          ? "postponed"
          : "upcoming";

  const homeTeamId =
    homeTeam?.id || m.homeCompetitionTeamId || m.homeSourceLabel || "tbd-home";
  const awayTeamId =
    awayTeam?.id || m.awayCompetitionTeamId || m.awaySourceLabel || "tbd-away";
  const competitionId = m.competition?.id || m.competitionId;
  const venueId = m.venue?.id || m.venueId;

  const events: MatchEvent[] = (m.events || []).map((e: any) => {
    const type = mapPrismaEventType(e);

    const eventTeamId =
      e.competitionTeam?.teamSeason?.team?.id ||
      (e.competitionTeamId === m.homeCompetitionTeamId
        ? homeTeamId
        : awayTeamId) ||
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
      playerId:
        e.player?.player?.fullName || e.player?.player?.id || e.playerId || "",
      assistPlayerId:
        e.assistPlayer?.player?.fullName ||
        e.assistPlayer?.player?.id ||
        e.assistPlayerId ||
        undefined,
    };
  });

  const penaltyAttempts = (m.penaltyAttempts || []).map(
    (p: any, idx: number) => {
      const teamId =
        p.competitionTeam?.teamSeason?.team?.id ||
        (p.competitionTeamId === m.homeCompetitionTeamId
          ? homeTeamId
          : awayTeamId) ||
        "";
      return {
        id: p.id,
        order: p.sequence || idx + 1,
        teamId,
        playerId:
          p.taker?.player?.fullName || p.taker?.player?.id || p.takerId || "",
        scored: Boolean(p.scored),
      };
    },
  );

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
    stage: m.stage
      ? (m.stage.toLowerCase().replace(/_/g, "-") as any)
      : "group",
    status,
    minute: m.minuteLabel || (status === "live" ? "1'" : undefined),
    currentPeriod: m.currentPeriod ?? undefined,
    date: m.kickoffAt
      ? new Date(m.kickoffAt).toISOString()
      : new Date().toISOString(),
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
    firstHalfStartedAt: m.firstHalfStartedAt
      ? new Date(m.firstHalfStartedAt).toISOString()
      : undefined,
    secondHalfStartedAt: m.secondHalfStartedAt
      ? new Date(m.secondHalfStartedAt).toISOString()
      : undefined,
    formationHome: m.formationHome || "4-3-3",
    formationAway: m.formationAway || "4-3-3",
    events,
  };
}

// ─── 1. HOME DATA ────────────────────────────────────────────────────────────

export async function getPublicHomeData(): Promise<PublicHomeData> {
  const currentSeason =
    seasons.find((s) => s.status === "active") ?? seasons[0];
  const sampleTable = getTableRows("akure").slice(0, 6);
  const publicMatches = getPublicMatches(matches);

  if (!hasDatabaseConfig()) {
    return {
      liveMatches: publicMatches.filter((m) => m.status === "live"),
      upcomingMatches: publicMatches
        .filter((m) => m.status === "upcoming")
        .slice(0, 3),
      finishedMatches: publicMatches
        .filter((m) => m.status === "finished")
        .slice(0, 3),
      recentNews: newsPosts.slice(0, 3),
      featuredTableRows: sampleTable,
      featuredCompetitionName: "Akure South & North",
      topScorers: getPublicPlayers(getTopScorers()).slice(0, 5),
      activeCompetitionCount: competitions.filter((c) => c.status === "active")
        .length,
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
        where: {
          status: { in: ["LIVE", "HALFTIME", "PENALTIES"] as any },
          competition: PUBLIC_COMPETITION_CONTENT_WHERE as any,
        },
        orderBy: { kickoffAt: "asc" },
        take: 6,
        include: {
          competition: true,
          venue: true,
          homeCompetitionTeam: {
            include: { teamSeason: { include: { team: true } } },
          },
          awayCompetitionTeam: {
            include: { teamSeason: { include: { team: true } } },
          },
          events: true,
          penaltyAttempts: {
            include: { taker: { include: { player: true } } },
          },
        },
      }),
      prisma.match.findMany({
        where: {
          status: "UPCOMING",
          competition: PUBLIC_COMPETITION_CONTENT_WHERE as any,
        },
        orderBy: { kickoffAt: "asc" },
        take: 6,
        include: {
          competition: true,
          venue: true,
          homeCompetitionTeam: {
            include: { teamSeason: { include: { team: true } } },
          },
          awayCompetitionTeam: {
            include: { teamSeason: { include: { team: true } } },
          },
        },
      }),
      prisma.match.findMany({
        where: {
          status: "FULLTIME",
          competition: PUBLIC_COMPETITION_CONTENT_WHERE as any,
        },
        orderBy: { kickoffAt: "desc" },
        take: 6,
        include: {
          competition: true,
          venue: true,
          homeCompetitionTeam: {
            include: { teamSeason: { include: { team: true } } },
          },
          awayCompetitionTeam: {
            include: { teamSeason: { include: { team: true } } },
          },
          events: true,
          penaltyAttempts: {
            include: { taker: { include: { player: true } } },
          },
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
      upcomingMatches: mappedUpcoming.length
        ? mappedUpcoming
        : publicMatches.filter((m) => m.status === "upcoming").slice(0, 3),
      finishedMatches: mappedFinished.length
        ? mappedFinished
        : publicMatches.filter((m) => m.status === "finished").slice(0, 3),
      recentNews: mappedNews.length ? mappedNews : newsPosts.slice(0, 3),
      featuredTableRows: sampleTable,
      featuredCompetitionName: "Akure South & North",
      topScorers: getPublicPlayers(getTopScorers()).slice(0, 5),
      activeCompetitionCount:
        dbCompetitions.length ||
        competitions.filter((c) => c.status === "active").length,
      currentSeasonLabel: currentSeasonDb?.label ?? currentSeason.label,
    };
  } catch {
    return {
      liveMatches: publicMatches.filter((m) => m.status === "live"),
      upcomingMatches: publicMatches
        .filter((m) => m.status === "upcoming")
        .slice(0, 3),
      finishedMatches: publicMatches
        .filter((m) => m.status === "finished")
        .slice(0, 3),
      recentNews: newsPosts.slice(0, 3),
      featuredTableRows: sampleTable,
      featuredCompetitionName: "Akure South & North",
      topScorers: getPublicPlayers(getTopScorers()).slice(0, 5),
      activeCompetitionCount: competitions.filter((c) => c.status === "active")
        .length,
      currentSeasonLabel: currentSeason.label,
    };
  }
}

// ─── 2. COMPETITIONS DATA ───────────────────────────────────────────────────

export async function getPublicCompetitions(): Promise<
  PublicCompetitionItem[]
> {
  if (!hasDatabaseConfig()) {
    return competitions.map((c) => ({
      ...c,
      leaderName: getPublicCompetitionLeaderName(c),
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
        leaderName: getPublicCompetitionLeaderName(c),
      }));
    }

    return dbCompetitions.map((c) => {
      const competition = mapPrismaCompetitionToPublic(c);

      return {
        ...competition,
        leaderName: isPendingSuperCup(competition)
          ? "Pending qualifiers"
          : (getTableRows(c.slug)[0]?.name ??
            getTableRows(c.id)[0]?.name ??
            "In progress"),
      };
    });
  } catch {
    return competitions.map((c) => ({
      ...c,
      leaderName: getPublicCompetitionLeaderName(c),
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
      shouldShowCompetitionIdContent(m.competitionId) &&
      m.stage !== "group" &&
      STAGE_ORDER[m.stage] !== undefined,
  );

  if (compMatches.length === 0) return [];

  const grouped: Record<string, Match[]> = {};
  for (const m of compMatches) {
    if (!grouped[m.stage]) grouped[m.stage] = [];
    grouped[m.stage].push(m);
  }

  const result: BracketMatch[] = [];
  for (const stage of Object.keys(grouped).sort(
    (a, b) => (STAGE_ORDER[a] ?? 99) - (STAGE_ORDER[b] ?? 99),
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
          ? {
              id: home.id,
              name: home.name,
              shortName: home.shortName,
              logo: home.logo,
            }
          : null,
        away: away
          ? {
              id: away.id,
              name: away.name,
              shortName: away.shortName,
              logo: away.logo,
            }
          : null,
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
        penalties: m.penalties
          ? { home: m.penalties.home, away: m.penalties.away }
          : null,
        status: m.status,
        minute: m.minute ?? null,
      });
    });
  }
  return result;
}

function mapCompetitionTeamToPublicTeam(
  competitionTeam: any,
  competitionId: string,
): Team {
  const teamSeason = competitionTeam.teamSeason;
  const team = teamSeason.team;

  return {
    id: team.id,
    slug: team.slug,
    seasonId: teamSeason.seasonId,
    competitionIds: [competitionId],
    name: team.name,
    shortName: team.shortName,
    logo: team.logoUrl || "/football club.png",
    community: team.community || "Akure",
    coach: teamSeason.coachName || "Coach",
    captain: teamSeason.captainName || "Captain",
    pot: competitionTeam.pot?.number ?? competitionTeam.seed ?? 1,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    form: [],
  };
}

function mapCompetitionStandingToPublicTeam(standing: any): Team {
  const team = mapCompetitionTeamToPublicTeam(
    standing.competitionTeam,
    standing.competitionId,
  );

  return {
    ...team,
    played: standing.played,
    wins: standing.wins,
    draws: standing.draws,
    losses: standing.losses,
    goalsFor: standing.goalsFor,
    goalsAgainst: standing.goalsAgainst,
    points: standing.points,
    form: (standing.form || "")
      .split("")
      .filter(
        (c: string): c is "W" | "D" | "L" =>
          c === "W" || c === "D" || c === "L",
      )
      .slice(-5),
  };
}

function getFallbackCompetitionDetail(competition: Competition) {
  const pendingSuperCup = isPendingSuperCup(competition);
  const knockoutMatches = pendingSuperCup
    ? []
    : buildKnockoutMatches(competition.id);

  return {
    competition,
    tableRows: pendingSuperCup ? [] : getTableRows(competition.id),
    teams: pendingSuperCup ? [] : getTeamsForCompetition(competition.id),
    matches: pendingSuperCup ? [] : getMatchesForCompetition(competition.id),
    news: newsPosts.filter((post) => post.competitionId === competition.id),
    knockoutMatches,
    hasKnockout: knockoutMatches.length > 0,
  };
}

export async function getPublicCompetitionDetail(slug: string) {
  const fallbackComp = getCompetitionBySlug(slug);

  if (!hasDatabaseConfig()) {
    return getFallbackCompetitionDetail(fallbackComp);
  }

  try {
    const prisma = getPrismaClient();
    const dbComp = await prisma.competition.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: {
        teams: {
          include: {
            pot: true,
            teamSeason: { include: { team: true } },
          },
        },
        matches: {
          include: {
            venue: true,
            homeCompetitionTeam: {
              include: { teamSeason: { include: { team: true } } },
            },
            awayCompetitionTeam: {
              include: { teamSeason: { include: { team: true } } },
            },
            events: true,
            penaltyAttempts: {
              include: { taker: { include: { player: true } } },
            },
          },
          orderBy: { kickoffAt: "asc" },
        },
        newsPosts: {
          orderBy: { publishDate: "desc" },
        },
        standings: {
          include: {
            competitionTeam: {
              include: {
                pot: true,
                teamSeason: { include: { team: true } },
              },
            },
          },
          orderBy: { rank: "asc" },
        },
      },
    });

    if (!dbComp) {
      return getFallbackCompetitionDetail(fallbackComp);
    }

    const competition = mapPrismaCompetitionToPublic(dbComp);
    const pendingSuperCup = isPendingSuperCup(competition);
    const mappedMatches = pendingSuperCup
      ? []
      : dbComp.matches.map(mapPrismaMatchToPublicMatch);
    const mappedNews: NewsPost[] = dbComp.newsPosts.map((post) => ({
      id: post.id,
      slug: post.slug,
      competitionId: post.competitionId,
      title: post.title,
      excerpt: post.excerpt ?? "",
      content: [post.content],
      coverImage: post.coverImageUrl,
      publishDate: post.publishDate.toISOString(),
    }));

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
          penalties: m.penalties
            ? { home: m.penalties.home, away: m.penalties.away }
            : null,
          status: m.status,
          minute: m.minute ?? null,
        };
      });
    const fallbackKnockoutMatches = pendingSuperCup
      ? []
      : buildKnockoutMatches(fallbackComp.id);

    return {
      competition,
      tableRows: pendingSuperCup
        ? []
        : dbComp.standings.length
          ? dbComp.standings.map(mapCompetitionStandingToPublicTeam)
          : getTableRows(fallbackComp.id),
      teams: pendingSuperCup
        ? []
        : dbComp.teams.length
          ? dbComp.teams.map((team) =>
              mapCompetitionTeamToPublicTeam(team, dbComp.id),
            )
          : getTeamsForCompetition(fallbackComp.id),
      matches: mappedMatches.length
        ? mappedMatches
        : pendingSuperCup
          ? []
          : getMatchesForCompetition(fallbackComp.id),
      news: mappedNews.length
        ? mappedNews
        : newsPosts.filter((post) => post.competitionId === fallbackComp.id),
      knockoutMatches: compKnockoutMatches.length
        ? compKnockoutMatches
        : fallbackKnockoutMatches,
      hasKnockout:
        compKnockoutMatches.length > 0 || fallbackKnockoutMatches.length > 0,
    };
  } catch {
    return getFallbackCompetitionDetail(fallbackComp);
  }
}

// ─── 4. TEAMS DATA ───────────────────────────────────────────────────────────

export async function getPublicTeamsData(filters?: {
  competition?: string;
  season?: string;
}) {
  const selectedCompetition = filters?.competition ?? "all";
  const selectedSeason = filters?.season ?? seasons[0].id;
  const selectedCompetitionRecord =
    selectedCompetition === "all"
      ? null
      : getCompetitionById(selectedCompetition);
  const seasonCompetitions = competitions.filter(
    (competition) => competition.seasonId === selectedSeason,
  );
  const visibleCompetitions =
    selectedCompetitionRecord && selectedCompetition !== "all"
      ? [selectedCompetitionRecord]
      : seasonCompetitions.filter(shouldShowCompetitionContent);
  const sections = visibleCompetitions.map((competition) => {
    const isPendingSuperCup =
      competition.type === "Super Cup" && competition.status === "upcoming";
    const competitionTeams = isPendingSuperCup
      ? []
      : getTableRows(competition.id);

    return {
      competition,
      teams: competitionTeams,
      topTeam: competitionTeams[0] ?? null,
      totalGoals: competitionTeams.reduce(
        (sum, team) => sum + team.goalsFor,
        0,
      ),
      isPendingSuperCup,
    };
  });
  const visibleTeams = sections.flatMap((section) => section.teams);

  return {
    teams: visibleTeams,
    sections,
    seasonsList: seasons,
    competitionsList: competitions,
    topTeam: [...visibleTeams].sort((a, b) => b.points - a.points)[0] ?? null,
    totalGoals: visibleTeams.reduce((sum, team) => sum + team.goalsFor, 0),
    selectedCompetitionName:
      selectedCompetition === "all"
        ? "All competitions"
        : (getCompetitionById(selectedCompetition)?.name ?? "All competitions"),
  };
}

export async function getPublicTeamDetail(slug: string) {
  const team = getTeamBySlug(slug);
  if (!team) return null;
  if (!team.competitionIds.some(shouldShowCompetitionIdContent)) return null;

  const teamPlayers = getPlayersForTeam(team.id);
  const teamMatches = getMatchesForTeam(team.id).filter((match) =>
    shouldShowCompetitionIdContent(match.competitionId),
  );
  const teamCompetitions = team.competitionIds
    .map((id) => getCompetitionById(id))
    .filter(shouldShowCompetitionContent) as Competition[];

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

  const visiblePlayers = getPublicPlayers(players).filter((player) => {
    const team = getTeamById(player.teamId);
    const competitionMatch =
      selectedCompetition === "all" ||
      team?.competitionIds.includes(selectedCompetition);
    const publicCompetitionMatch =
      selectedCompetition === "all" ||
      shouldShowCompetitionIdContent(selectedCompetition);
    const teamMatch = selectedTeam === "all" || player.teamId === selectedTeam;
    const positionMatch =
      selectedPosition === "all" || player.positionGroup === selectedPosition;

    return (
      competitionMatch &&
      publicCompetitionMatch &&
      teamMatch &&
      positionMatch
    );
  });

  return {
    players: visiblePlayers,
    teamsList: getPublicTeams(teams),
    competitionsList: competitions,
    seasonsList: seasons,
    positionsList: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
  };
}

export async function getPublicPlayerDetail(slug: string) {
  const player = getPlayerBySlug(slug);
  if (!player) return null;

  const team = getTeamById(player.teamId);
  if (!team?.competitionIds.some(shouldShowCompetitionIdContent)) return null;

  const teamMatches = getMatchesForTeam(player.teamId)
    .filter((match) => shouldShowCompetitionIdContent(match.competitionId))
    .slice(0, 3);

  return {
    player,
    team,
    matches: teamMatches,
  };
}

// ─── 6. FIXTURES & MATCHES DATA ─────────────────────────────────────────────

function sortFixturesForDefaultView(matches: Match[]) {
  const statusOrder: Record<Match["status"], number> = {
    finished: 0,
    live: 1,
    postponed: 2,
    upcoming: 3,
  };

  return [...matches].sort((a, b) => {
    const statusDiff =
      (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);

    if (statusDiff !== 0) {
      return statusDiff;
    }

    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();

    if (a.status === "finished" || a.status === "live") {
      return bTime - aTime;
    }

    return aTime - bTime;
  });
}

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
      const [dbMatches, dbCompetitions, dbSeasons, dbTeams] = await Promise.all(
        [
          prisma.match.findMany({
            include: {
              competition: true,
              venue: true,
              homeCompetitionTeam: {
                include: { teamSeason: { include: { team: true } } },
              },
              awayCompetitionTeam: {
                include: { teamSeason: { include: { team: true } } },
              },
              events: true,
              penaltyAttempts: {
                include: { taker: { include: { player: true } } },
              },
            },
            orderBy: { kickoffAt: "asc" },
          }),
          prisma.competition.findMany({ orderBy: { name: "asc" } }),
          prisma.season.findMany({ orderBy: { startsAt: "desc" } }),
          prisma.team.findMany({
            orderBy: { name: "asc" },
            include: {
              seasons: {
                include: {
                  competitions: {
                    include: {
                      competition: true,
                      pot: true,
                    },
                  },
                },
              },
            },
          }),
        ],
      );

      if (dbMatches.length > 0) {
        const mappedMatches = dbMatches
          .filter((match) =>
            shouldShowCompetitionContent(
              mapPrismaCompetitionToPublic(match.competition),
            ),
          )
          .map(mapPrismaMatchToPublicMatch);

        const filtered = mappedMatches.filter((match) => {
          const statusMatch =
            selectedStatus === "all" || match.status === selectedStatus;
          const seasonMatch =
            selectedSeason === "all" || match.seasonId === selectedSeason;
          const competitionMatch =
            selectedCompetition === "all" ||
            match.competitionId === selectedCompetition;
          const teamMatch =
            selectedTeam === "all" ||
            match.homeTeamId === selectedTeam ||
            match.awayTeamId === selectedTeam;
          const matchdayMatch =
            selectedMatchday === "all" || match.matchday === selectedMatchday;

          return (
            statusMatch &&
            seasonMatch &&
            competitionMatch &&
            teamMatch &&
            matchdayMatch
          );
        });

        const orderedMatches = sortFixturesForDefaultView(filtered);
        const matchdays = Array.from(
          new Set(orderedMatches.map((m) => m.matchday)),
        );

        const mappedCompetitions: Competition[] = dbCompetitions.map(
          mapPrismaCompetitionToPublic,
        );

        const mappedTeams: Team[] = dbTeams.flatMap((t) => {
          const publicCompetitionEntries = t.seasons.flatMap((teamSeason) =>
            teamSeason.competitions
              .filter((competitionTeam) =>
                shouldShowCompetitionContent(
                  mapPrismaCompetitionToPublic(competitionTeam.competition),
                ),
              )
              .map((competitionTeam) => ({
                competitionTeam,
                teamSeason,
              })),
          );

          if (!publicCompetitionEntries.length) {
            return [];
          }

          const primaryEntry = publicCompetitionEntries[0];

          return [
            {
              id: t.id,
              slug: t.slug,
              seasonId:
                primaryEntry.teamSeason.seasonId ||
                dbSeasons[0]?.id ||
                "2026-2027",
              competitionIds: Array.from(
                new Set(
                  publicCompetitionEntries.map(
                    (entry) => entry.competitionTeam.competitionId,
                  ),
                ),
              ),
              name: t.name,
              shortName: t.shortName,
              logo: t.logoUrl || "/football club.png",
              community: t.community || "Akure",
              coach: primaryEntry.teamSeason.coachName || "Coach",
              captain: primaryEntry.teamSeason.captainName || "Captain",
              pot:
                primaryEntry.competitionTeam.pot?.number ??
                primaryEntry.competitionTeam.seed ??
                1,
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              points: 0,
              form: [],
            },
          ];
        });

        const mappedSeasons: Season[] = dbSeasons.map((s) => ({
          id: s.id,
          label: s.label,
          status: s.isCurrent ? "active" : "upcoming",
        }));

        return {
          matches: orderedMatches,
          seasonsList: mappedSeasons.length ? mappedSeasons : seasons,
          competitionsList: mappedCompetitions.length
            ? mappedCompetitions
            : competitions,
          teamsList: mappedTeams.length ? mappedTeams : getPublicTeams(teams),
          matchdays: matchdays.length
            ? matchdays
            : Array.from(
                new Set(getPublicMatches(matches).map((m) => m.matchday)),
              ),
          hasLiveMatches: mappedMatches.some((m) => m.status === "live"),
        };
      }
    } catch (e) {
      console.error("Failed to query DB fixtures, falling back to mock:", e);
    }
  }

  // Fallback to sample
  const publicMatches = getPublicMatches(matches);
  const matchdays = Array.from(new Set(publicMatches.map((m) => m.matchday)));
  const filteredMatches = publicMatches.filter((match) => {
    const statusMatch =
      selectedStatus === "all" || match.status === selectedStatus;
    const seasonMatch =
      selectedSeason === "all" || match.seasonId === selectedSeason;
    const competitionMatch =
      selectedCompetition === "all" ||
      match.competitionId === selectedCompetition;
    const teamMatch =
      selectedTeam === "all" ||
      match.homeTeamId === selectedTeam ||
      match.awayTeamId === selectedTeam;
    const matchdayMatch =
      selectedMatchday === "all" || match.matchday === selectedMatchday;

    return (
      statusMatch &&
      seasonMatch &&
      competitionMatch &&
      teamMatch &&
      matchdayMatch
    );
  });

  const orderedMatches = sortFixturesForDefaultView(filteredMatches);

  return {
    matches: orderedMatches,
    seasonsList: seasons,
    competitionsList: competitions,
    teamsList: getPublicTeams(teams),
    matchdays,
    hasLiveMatches: publicMatches.some((m) => m.status === "live"),
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
              competitionTeam: {
                include: { teamSeason: { include: { team: true } } },
              },
              player: { include: { player: true } },
              assistPlayer: { include: { player: true } },
              playerIn: { include: { player: true } },
              playerOut: { include: { player: true } },
            },
            orderBy: [
              { minute: "asc" },
              { sortOrder: "asc" },
              { createdAt: "asc" },
            ],
          },
          penaltyAttempts: {
            include: {
              competitionTeam: {
                include: { teamSeason: { include: { team: true } } },
              },
              taker: { include: { player: true } },
            },
            orderBy: { sequence: "asc" },
          },
          lineups: {
            include: {
              players: {
                include: { squadPlayer: { include: { player: true } } },
                orderBy: [{ role: "asc" }, { sortOrder: "asc" }],
              },
            },
          },
        },
      });

      if (dbMatch) {
        const competition = mapPrismaCompetitionToPublic(dbMatch.competition);

        if (!shouldShowCompetitionContent(competition)) {
          return null;
        }

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

        const venue: Venue = {
          id: dbMatch.venue.id,
          slug: dbMatch.venue.slug,
          name: dbMatch.venue.name,
          location: dbMatch.venue.location,
        };

        const mapSquadPlayerToPublicPlayer = (
          sq: any,
          teamId: string,
          overrides?: { number?: number | null; position?: string | null },
        ): Player => ({
            id: sq.player.id,
            slug: sq.player.slug,
            teamId,
            name: sq.player.fullName,
            photo: sq.player.photoUrl || "/Profile.png",
            number: overrides?.number ?? sq.squadNumber,
            positionGroup:
              sq.positionCategory === "GOALKEEPER"
                ? "Goalkeeper"
                : sq.positionCategory === "DEFENDER"
                  ? "Defender"
                  : sq.positionCategory === "MIDFIELDER"
                    ? "Midfielder"
                    : "Forward",
            detailedPosition: overrides?.position || sq.detailedPosition || "MF",
            dateOfBirth: sq.player.dateOfBirth.toISOString().split("T")[0],
            appearances: 0,
            goals: 0,
            assists: 0,
            cleanSheets: 0,
            yellowCards: 0,
            redCards: 0,
          });

        const findLineup = (competitionTeamId: string | null | undefined) =>
          dbMatch.lineups.find(
            (lineup) => lineup.competitionTeamId === competitionTeamId,
          );
        const mapLineupToPlayers = (lineup: any, teamId: string): Player[] =>
          (lineup?.players || []).map((lineupPlayer: any) =>
            mapSquadPlayerToPublicPlayer(lineupPlayer.squadPlayer, teamId, {
              number: lineupPlayer.shirtNumber,
              position: lineupPlayer.position,
            }),
          );
        const homeLineup = findLineup(dbMatch.homeCompetitionTeamId);
        const awayLineup = findLineup(dbMatch.awayCompetitionTeamId);
        const homePlayers = mapLineupToPlayers(homeLineup, homeTeam.id);
        const awayPlayers = mapLineupToPlayers(awayLineup, awayTeam.id);

        const match = {
          ...mapPrismaMatchToPublicMatch(dbMatch),
          formationHome: homeLineup?.formation ?? undefined,
          formationAway: awayLineup?.formation ?? undefined,
        };

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
          homePlayers,
          awayPlayers,
          enrichedEvents,
          enrichedAttempts,
        };
      }
    } catch (e) {
      console.error(
        "Failed to load match from database, falling back to mock:",
        e,
      );
    }
  }

  // Fallback to sample mock data
  const match = getMatchBySlug(slug);
  if (!match) return null;

  const homeTeam = getTeamById(match.homeTeamId);
  const awayTeam = getTeamById(match.awayTeamId);
  const competition = getCompetitionById(match.competitionId);
  const venue = getVenueById(match.venueId);

  if (
    !homeTeam ||
    !awayTeam ||
    !competition ||
    !venue ||
    !shouldShowCompetitionContent(competition)
  )
    return null;

  const homePlayers = getPlayersForTeam(homeTeam.id);
  const awayPlayers = getPlayersForTeam(awayTeam.id);

  const allMatchPlayers = [...homePlayers, ...awayPlayers];
  const playerMap = Object.fromEntries(
    allMatchPlayers.map((p) => [p.id, { name: p.name, number: p.number }]),
  );

  const enrichedEvents = match.events.map((evt) => ({
    ...evt,
    playerName: playerMap[evt.playerId]?.name ?? evt.playerId,
    playerNumber: playerMap[evt.playerId]?.number ?? null,
    assistPlayerName: evt.assistPlayerId
      ? (playerMap[evt.assistPlayerId]?.name ?? evt.assistPlayerId)
      : null,
    playerInName: null,
    playerOutName: null,
    note: null,
  }));

  const enrichedAttempts = (match.penalties?.attempts ?? []).map((a) => ({
    ...a,
    playerName: playerMap[a.playerId]?.name ?? a.playerId,
    playerNumber: playerMap[a.playerId]?.number ?? null,
    teamName:
      a.teamId === homeTeam.id ? homeTeam.shortName : awayTeam.shortName,
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

export async function getPublicNewsData(filters?: {
  competition?: string;
  season?: string;
}) {
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

export async function getPublicTablesData(filters?: {
  competition?: string;
  season?: string;
}) {
  const selectedCompetitionKey = filters?.competition ?? "all";
  const selectedSeason = filters?.season ?? seasons[0].id;
  const selectedCompetition =
    selectedCompetitionKey === "all"
      ? null
      : getCompetitionById(selectedCompetitionKey);
  const seasonCompetitions = competitions.filter(
    (competition) => competition.seasonId === selectedSeason,
  );
  const visibleCompetitions =
    selectedCompetitionKey !== "all" && selectedCompetition
      ? [selectedCompetition]
      : seasonCompetitions.filter(shouldShowCompetitionTable);

  const buildResult = (
    sections: Array<{
      competition: Competition;
      teams: Team[];
      isPendingSuperCup: boolean;
    }>,
  ) => {
    const tableRows = sections.flatMap((section) => section.teams);

    return {
      selectedCompetition:
        selectedCompetition ?? sections[0]?.competition ?? competitions[0],
      selectedCompetitionName:
        selectedCompetitionKey === "all"
          ? "All competitions"
          : (selectedCompetition?.name ?? "All competitions"),
      tableRows,
      sections,
      seasonsList: seasons,
      competitionsList: competitions,
    };
  };

  if (hasDatabaseConfig()) {
    try {
      const prisma = getPrismaClient();
      const dbStandings = await prisma.competitionStanding.findMany({
        where:
          selectedCompetitionKey === "all"
            ? { seasonId: selectedSeason }
            : {
                seasonId: selectedSeason,
                competition: {
                  OR: [
                    { id: selectedCompetitionKey },
                    { slug: selectedCompetitionKey },
                  ],
                },
              },
        include: {
          competition: true,
          competitionTeam: {
            include: {
              pot: true,
              teamSeason: {
                include: { team: true },
              },
            },
          },
        },
        orderBy: [{ competitionId: "asc" }, { rank: "asc" }],
      });

      if (dbStandings.length > 0) {
        const sectionsByCompetition = new Map<
          string,
          {
            competition: Competition;
            teams: Team[];
            isPendingSuperCup: boolean;
          }
        >();

        for (const s of dbStandings) {
          const competition: Competition = {
            id: s.competition.id,
            slug: s.competition.slug,
            seasonId: s.competition.seasonId,
            name: s.competition.name,
            type:
              s.competition.type === "SUPER_CUP"
                ? "Super Cup"
                : "Local Government",
            status:
              s.competition.status === "ACTIVE"
                ? "active"
                : s.competition.status === "COMPLETED"
                  ? "completed"
                  : "upcoming",
            plannedTeams: s.competition.plannedTeamCount,
            potCount: s.competition.potCount,
            qualifiers: s.competition.qualifiersCount,
            knockoutStart:
              s.competition.knockoutStartRound === "ROUND_OF_16"
                ? "Round of 16"
                : "Quarter-final",
            description: s.competition.description,
          };
          const isPendingSuperCup =
            competition.type === "Super Cup" &&
            competition.status === "upcoming";

          if (
            selectedCompetitionKey === "all" &&
            !shouldShowCompetitionTable(competition)
          ) {
            continue;
          }

          if (isPendingSuperCup) {
            sectionsByCompetition.set(competition.id, {
              competition,
              teams: [],
              isPendingSuperCup,
            });
            continue;
          }

          const t = s.competitionTeam.teamSeason.team;
          const team: Team = {
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
            pot: s.competitionTeam.pot?.number ?? 1,
            played: s.played,
            wins: s.wins,
            draws: s.draws,
            losses: s.losses,
            goalsFor: s.goalsFor,
            goalsAgainst: s.goalsAgainst,
            points: s.points,
            form: (s.form || "")
              .split("")
              .filter(
                (c): c is "W" | "D" | "L" =>
                  c === "W" || c === "D" || c === "L",
              )
              .slice(-5),
          };

          const section = sectionsByCompetition.get(competition.id) ?? {
            competition,
            teams: [],
            isPendingSuperCup,
          };
          section.teams.push(team);
          sectionsByCompetition.set(competition.id, section);
        }

        const sections = Array.from(sectionsByCompetition.values()).sort(
          (a, b) =>
            getCompetitionSortOrder(a.competition) -
            getCompetitionSortOrder(b.competition),
        );

        if (sections.length > 0) {
          return buildResult(sections);
        }
      }
    } catch (e) {
      console.error("Failed to query DB standings:", e);
    }
  }

  const sections = visibleCompetitions.map((competition) => {
    const isPendingSuperCup =
      competition.type === "Super Cup" && competition.status === "upcoming";

    return {
      competition,
      teams: isPendingSuperCup ? [] : getTableRows(competition.id),
      isPendingSuperCup,
    };
  });

  return buildResult(sections);
}

function shouldShowCompetitionTable(competition: Competition) {
  return shouldShowCompetitionContent(competition);
}

function getCompetitionSortOrder(competition: Competition) {
  const index = competitions.findIndex(
    (item) => item.id === competition.id || item.slug === competition.slug,
  );

  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export async function getPublicStatisticsData(filters?: {
  competition?: string;
  season?: string;
}) {
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
          competition: true,
          squadPlayer: {
            include: {
              player: true,
              teamSeason: { include: { team: true } },
            },
          },
        },
      });

      if (stats.length > 0) {
        const visibleStats = stats.filter((stat) =>
          shouldShowCompetitionContent(
            mapPrismaCompetitionToPublic(stat.competition),
          ),
        );
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
          dateOfBirth: s.squadPlayer.player.dateOfBirth
            .toISOString()
            .split("T")[0],
          appearances: s.appearances,
          goals: s.goals,
          assists: s.assists,
          cleanSheets: s.cleanSheets,
          yellowCards: s.yellowCards,
          redCards: s.redCards,
        });

        const allMapped = visibleStats.map(mapStatToPlayer);
        const scorers = [...allMapped].sort((a, b) => b.goals - a.goals);
        const assists = [...allMapped].sort((a, b) => b.assists - a.assists);
        const cleanSheets = [...allMapped].sort(
          (a, b) => b.cleanSheets - a.cleanSheets,
        );

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
    if (!team) return false;

    if (selectedCompetition !== "all") {
      return (
        shouldShowCompetitionIdContent(selectedCompetition) &&
        team.competitionIds.includes(selectedCompetition)
      );
    }

    return team.competitionIds.some(shouldShowCompetitionIdContent);
  };

  const scorers = getTopScorers().filter((p) => inCompetition(p.teamId));
  const assists = getAssistLeaders().filter((p) => inCompetition(p.teamId));
  const cleanSheets = getCleanSheetLeaders().filter((p) =>
    inCompetition(p.teamId),
  );

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
          matches: {
            include: { competition: true },
          },
        },
        orderBy: { name: "asc" },
      });
      if (dbVenues.length > 0) {
        return dbVenues.map((v) => ({
          id: v.id,
          name: v.name,
          location: v.location,
          matchCount: v.matches.filter((match) =>
            shouldShowCompetitionContent(
              mapPrismaCompetitionToPublic(match.competition),
            ),
          ).length,
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
    matchCount: getPublicMatches(matches).filter((m) => m.venueId === v.id)
      .length,
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
      selectedCompetition === "all" ||
      item.competitionId === selectedCompetition;
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

export async function getPublicAwardsData(filters?: {
  competition?: string;
  season?: string;
}) {
  const selectedCompetition = filters?.competition ?? "all";
  const selectedSeason = filters?.season ?? seasons[0].id;

  const visibleRecords = awardsRecords.filter((record) => {
    const seasonMatch = record.seasonId === selectedSeason;
    const competitionMatch =
      selectedCompetition === "all" ||
      record.competitionId === selectedCompetition;

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

  const searchableTeams = getPublicTeams(teams);
  const searchableMatches = getPublicMatches(matches);

  const matchedTeams = searchableTeams.filter(
    (t) =>
      t.name.toLowerCase().includes(q) || t.community.toLowerCase().includes(q),
  );

  const matchedPlayers = getPublicPlayers(players).filter((p) =>
    p.name.toLowerCase().includes(q),
  );

  const matchedMatches = searchableMatches.filter((m) => {
    const h = getTeamById(m.homeTeamId)?.name.toLowerCase() || "";
    const a = getTeamById(m.awayTeamId)?.name.toLowerCase() || "";
    return h.includes(q) || a.includes(q);
  });

  const matchedPosts = newsPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q),
  );

  return {
    q: query ?? "",
    teamResults: matchedTeams,
    playerResults: matchedPlayers,
    matchResults: matchedMatches,
    newsResults: matchedPosts,
  };
}

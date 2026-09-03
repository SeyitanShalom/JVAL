import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Prisma } from "@prisma/client";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import {
  defaultPlayerPhoto,
  defaultTeamLogo,
  type AwardRecord,
  type Competition,
  type EventType,
  type Match,
  type MatchEvent,
  type NewsPost,
  type Player,
  type Season,
  type Team,
  type Venue,
} from "@/lib/league-data";

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

const PUBLIC_COMPETITION_CONTENT_WHERE: Prisma.CompetitionWhereInput = {
  OR: [
    { type: { not: "SUPER_CUP" } },
    { status: { in: ["ACTIVE", "COMPLETED"] } },
  ],
};

const emptyHomeData: PublicHomeData = {
  liveMatches: [],
  upcomingMatches: [],
  finishedMatches: [],
  recentNews: [],
  featuredTableRows: [],
  featuredCompetitionName: "Standings",
  topScorers: [],
  activeCompetitionCount: 0,
  currentSeasonLabel: "No active season",
};

function mapPrismaSeasonToPublic(season: any): Season {
  return {
    id: season.id,
    label: season.label,
    status:
      season.status === "ACTIVE"
        ? "active"
        : season.status === "COMPLETED" || season.status === "ARCHIVED"
          ? "completed"
          : "upcoming",
  };
}

function mapCompetitionType(type: string): Competition["type"] {
  if (type === "SUPER_CUP") return "Super Cup";
  if (type === "STATE") return "State";
  if (type === "CUSTOM") return "Custom";
  return "Local Government";
}

function mapPrismaCompetitionToPublic(c: any): Competition {
  return {
    id: c.id,
    seasonId: c.seasonId,
    slug: c.slug,
    name: c.name,
    type: mapCompetitionType(c.type),
    status:
      c.status === "ACTIVE"
        ? "active"
        : c.status === "COMPLETED"
          ? "completed"
          : "upcoming",
    plannedTeams: c.plannedTeamCount,
    potCount: c.potCount,
    qualifiers: c.qualifiersCount,
    knockoutStart:
      c.knockoutStartRound === "ROUND_OF_16" ? "Round of 16" : "Quarter-final",
    description: c.description,
  };
}

function matchesCompetitionFilter(
  competition: Pick<Competition, "id" | "slug"> | undefined,
  selectedCompetition: string,
) {
  return (
    selectedCompetition === "all" ||
    competition?.id === selectedCompetition ||
    competition?.slug === selectedCompetition
  );
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

function getCurrentSeasonId(seasons: any[]) {
  return (
    seasons.find((season) => season.isCurrent)?.id ??
    seasons.find((season) => season.status === "ACTIVE")?.id ??
    seasons[0]?.id ??
    "all"
  );
}

function resolveSelectedSeason(filters: { season?: string } | undefined, dbSeasons: any[]) {
  return filters?.season ?? getCurrentSeasonId(dbSeasons);
}

function mapPositionCategory(category: string): Player["positionGroup"] {
  if (category === "GOALKEEPER") return "Goalkeeper";
  if (category === "DEFENDER") return "Defender";
  if (category === "FORWARD") return "Forward";
  return "Midfielder";
}

function getMatchStatus(status: string): Match["status"] {
  if (status === "LIVE" || status === "HALFTIME" || status === "PENALTIES") {
    return "live";
  }

  if (status === "FULLTIME") return "finished";
  if (status === "POSTPONED") return "postponed";
  return "upcoming";
}

function getMatchStage(stage?: string | null): Match["stage"] {
  const mapped = (stage ?? "GROUP").toLowerCase().replace(/_/g, "-");

  if (
    mapped === "round-of-16" ||
    mapped === "quarter-final" ||
    mapped === "semi-final" ||
    mapped === "third-place" ||
    mapped === "final"
  ) {
    return mapped;
  }

  return "group";
}

function mapPrismaEventType(e: any): EventType {
  const type = String(e.type ?? "").toUpperCase();
  const note = String(e.note ?? "").toLowerCase();

  if (type === "GOAL") return "Goal";
  if (type === "ASSIST") return "Assist";
  if (type === "YELLOW_CARD") return "Yellow card";
  if (type === "RED_CARD") return "Red card";
  if (type === "SUBSTITUTION") return "Substitution";
  if (type === "PENALTY_SCORED") return "Penalty scored";
  if (type === "PENALTY_MISSED") return "Penalty missed";
  if (type === "OWN_GOAL") return "Own goal";
  if (type === "NOTE" && note.includes("disallowed goal")) {
    return "Disallowed goal";
  }

  return "Note";
}

function getMatchTeamId(match: any, side: "home" | "away") {
  const competitionTeam = match[`${side}CompetitionTeam`];
  return (
    competitionTeam?.teamSeason?.team?.id ??
    match[`${side}CompetitionTeamId`] ??
    match[`${side}SourceLabel`] ??
    `${side}-team`
  );
}

function getMatchTeamName(match: any, side: "home" | "away") {
  const competitionTeam = match[`${side}CompetitionTeam`];
  return competitionTeam?.teamSeason?.team?.name ?? match[`${side}SourceLabel`] ?? "TBD";
}

function getMatchTeamShort(match: any, side: "home" | "away") {
  const competitionTeam = match[`${side}CompetitionTeam`];
  return competitionTeam?.teamSeason?.team?.shortName ?? "TBD";
}

function getMatchTeamLogo(match: any, side: "home" | "away") {
  const competitionTeam = match[`${side}CompetitionTeam`];
  return competitionTeam?.teamSeason?.team?.logoUrl || defaultTeamLogo;
}

export function mapPrismaMatchToPublicMatch(m: any): Match {
  const status = getMatchStatus(String(m.status ?? ""));
  const homeTeamId = getMatchTeamId(m, "home");
  const awayTeamId = getMatchTeamId(m, "away");

  const events: MatchEvent[] = (m.events ?? []).map((event: any) => {
    const eventType = mapPrismaEventType(event);
    const rawTeamId =
      event.competitionTeam?.teamSeason?.team?.id ||
      (event.competitionTeamId === m.homeCompetitionTeamId
        ? homeTeamId
        : awayTeamId);
    const teamId =
      eventType === "Own goal" && rawTeamId === homeTeamId
        ? awayTeamId
        : eventType === "Own goal" && rawTeamId === awayTeamId
          ? homeTeamId
          : rawTeamId;

    return {
      id: event.id,
      minute: event.minuteLabel || (event.minute ? `${event.minute}'` : "0'"),
      type: eventType,
      teamId,
      playerId:
        event.player?.player?.fullName || event.player?.player?.id || event.playerId || "",
      assistPlayerId:
        event.assistPlayer?.player?.fullName ||
        event.assistPlayer?.player?.id ||
        event.assistPlayerId ||
        undefined,
    };
  });

  const penaltyAttempts = (m.penaltyAttempts ?? []).map(
    (attempt: any, index: number) => ({
      id: attempt.id,
      order: attempt.sequence || index + 1,
      teamId:
        attempt.competitionTeam?.teamSeason?.team?.id ||
        (attempt.competitionTeamId === m.homeCompetitionTeamId ? homeTeamId : awayTeamId),
      playerId:
        attempt.taker?.player?.fullName || attempt.taker?.player?.id || attempt.takerId || "",
      scored: Boolean(attempt.scored),
    }),
  );

  const penalties =
    m.homePenaltyScore != null && m.awayPenaltyScore != null
      ? {
          home: m.homePenaltyScore,
          away: m.awayPenaltyScore,
          attempts: penaltyAttempts,
        }
      : undefined;

  return {
    id: m.id,
    slug: m.slug,
    seasonId: m.seasonId,
    competitionId: m.competition?.id ?? m.competitionId,
    competitionSlug: m.competition?.slug,
    competitionName: m.competition?.name,
    matchday: m.matchday || "Matchday 1",
    stage: getMatchStage(m.stage),
    status,
    minute: m.minuteLabel || (status === "live" ? "1'" : undefined),
    currentPeriod: m.currentPeriod ?? undefined,
    date: m.kickoffAt ? new Date(m.kickoffAt).toISOString() : new Date().toISOString(),
    venueId: m.venue?.id ?? m.venueId,
    venueName: m.venue?.name,
    venueLocation: m.venue?.location,
    homeTeamId,
    homeTeamName: getMatchTeamName(m, "home"),
    homeTeamShort: getMatchTeamShort(m, "home"),
    homeTeamLogo: getMatchTeamLogo(m, "home"),
    awayTeamId,
    awayTeamName: getMatchTeamName(m, "away"),
    awayTeamShort: getMatchTeamShort(m, "away"),
    awayTeamLogo: getMatchTeamLogo(m, "away"),
    homeScore: m.homeScore ?? undefined,
    awayScore: m.awayScore ?? undefined,
    referee: m.referee || undefined,
    formationHome: m.formationHome || undefined,
    formationAway: m.formationAway || undefined,
    firstHalfStartedAt: m.firstHalfStartedAt
      ? new Date(m.firstHalfStartedAt).toISOString()
      : undefined,
    secondHalfStartedAt: m.secondHalfStartedAt
      ? new Date(m.secondHalfStartedAt).toISOString()
      : undefined,
    events,
    penalties,
  };
}

function mapCompetitionTeamToPublicTeam(
  competitionTeam: any,
  competitionId: string,
  standing?: any,
): Team {
  const teamSeason = competitionTeam.teamSeason;
  const team = teamSeason.team;
  const form = String(standing?.form ?? "")
    .split("")
    .filter((result): result is "W" | "D" | "L" =>
      result === "W" || result === "D" || result === "L",
    )
    .slice(-5);

  return {
    id: team.id,
    slug: team.slug,
    seasonId: teamSeason.seasonId,
    competitionIds: [competitionId],
    name: team.name,
    shortName: team.shortName,
    logo: team.logoUrl || defaultTeamLogo,
    community: team.community || "",
    coach: teamSeason.coachName || "TBC",
    captain: teamSeason.captainName || "TBC",
    pot: competitionTeam.pot?.number ?? competitionTeam.seed ?? 0,
    played: standing?.played ?? 0,
    wins: standing?.wins ?? 0,
    draws: standing?.draws ?? 0,
    losses: standing?.losses ?? 0,
    goalsFor: standing?.goalsFor ?? 0,
    goalsAgainst: standing?.goalsAgainst ?? 0,
    points: standing?.points ?? 0,
    form,
  };
}

function mapCompetitionStandingToPublicTeam(standing: any): Team {
  return mapCompetitionTeamToPublicTeam(
    standing.competitionTeam,
    standing.competitionId,
    standing,
  );
}

function sortTeamsForTable(rows: Team[]) {
  return [...rows].sort((a, b) => {
    const goalDifferenceA = a.goalsFor - a.goalsAgainst;
    const goalDifferenceB = b.goalsFor - b.goalsAgainst;

    return (
      b.points - a.points ||
      goalDifferenceB - goalDifferenceA ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name)
    );
  });
}

function buildCompetitionSections(dbCompetitions: any[]) {
  return dbCompetitions.map((dbCompetition) => {
    const competition = mapPrismaCompetitionToPublic(dbCompetition);
    const pendingSuperCup = isPendingSuperCup(competition);
    const standingRows = (dbCompetition.standings ?? []).map(
      mapCompetitionStandingToPublicTeam,
    );
    const teamRows = (dbCompetition.teams ?? []).map((team: any) =>
      mapCompetitionTeamToPublicTeam(team, dbCompetition.id),
    );
    const teams: Team[] = pendingSuperCup
      ? []
      : standingRows.length
        ? standingRows
        : sortTeamsForTable(teamRows);

    return {
      competition,
      teams,
      topTeam: teams[0] ?? null,
      totalGoals: teams.reduce((sum, team) => sum + team.goalsFor, 0),
      isPendingSuperCup: pendingSuperCup,
    };
  });
}

function mapSquadPlayerToPublicPlayer(
  squadPlayer: any,
  teamId: string,
  selectedCompetition = "all",
): Player {
  const visibleStats = (squadPlayer.playerStats ?? []).filter((stat: any) => {
    if (selectedCompetition === "all") return true;
    return (
      stat.competitionId === selectedCompetition ||
      stat.competition?.slug === selectedCompetition
    );
  });

  const totals = visibleStats.reduce(
    (sum: Record<string, number>, stat: any) => ({
      appearances: sum.appearances + (stat.appearances ?? 0),
      goals: sum.goals + (stat.goals ?? 0),
      assists: sum.assists + (stat.assists ?? 0),
      cleanSheets: sum.cleanSheets + (stat.cleanSheets ?? 0),
      yellowCards: sum.yellowCards + (stat.yellowCards ?? 0),
      redCards: sum.redCards + (stat.redCards ?? 0),
    }),
    {
      appearances: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
    },
  );

  return {
    id: squadPlayer.player.id,
    slug: squadPlayer.player.slug,
    teamId,
    teamName: squadPlayer.teamSeason?.team?.name,
    name: squadPlayer.player.fullName,
    photo: squadPlayer.player.photoUrl || defaultPlayerPhoto,
    number: squadPlayer.squadNumber,
    positionGroup: mapPositionCategory(squadPlayer.positionCategory),
    detailedPosition: squadPlayer.detailedPosition || "TBC",
    dateOfBirth: squadPlayer.player.dateOfBirth.toISOString().split("T")[0],
    appearances: totals.appearances,
    goals: totals.goals,
    assists: totals.assists,
    cleanSheets: totals.cleanSheets,
    yellowCards: totals.yellowCards,
    redCards: totals.redCards,
  };
}

function mapDbNewsPost(post: any, competition?: any): NewsPost {
  return {
    id: post.id,
    slug: post.slug,
    competitionId: post.competitionId,
    competitionName: post.competition?.name ?? competition?.name ?? null,
    title: post.title,
    coverImage: post.coverImageUrl,
    publishDate: post.publishDate.toISOString(),
    excerpt: post.excerpt ?? "",
    content: String(post.content ?? "")
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
  };
}

function mapDbAwardRecord(record: any): AwardRecord {
  return {
    id: record.id,
    seasonId: record.seasonId,
    competitionId: record.competitionId,
    competitionName: record.competition?.name ?? null,
    title: record.title,
    winner: record.winnerText,
    detail: record.detail ?? record.value ?? "",
  };
}

function mapMatchToBracket(match: Match, matchNumber: number): BracketMatch {
  return {
    id: match.id,
    slug: match.slug,
    stage: match.stage,
    matchNumber,
    home: {
      id: match.homeTeamId,
      name: match.homeTeamName ?? "TBD",
      shortName: match.homeTeamShort ?? "TBD",
      logo: match.homeTeamLogo ?? defaultTeamLogo,
    },
    away: {
      id: match.awayTeamId,
      name: match.awayTeamName ?? "TBD",
      shortName: match.awayTeamShort ?? "TBD",
      logo: match.awayTeamLogo ?? defaultTeamLogo,
    },
    homeScore: match.homeScore ?? null,
    awayScore: match.awayScore ?? null,
    penalties: match.penalties
      ? { home: match.penalties.home, away: match.penalties.away }
      : null,
    status: match.status,
    minute: match.minute ?? null,
  };
}

function sortFixturesForDefaultView(matches: Match[]) {
  const statusOrder: Record<Match["status"], number> = {
    live: 0,
    upcoming: 1,
    postponed: 2,
    finished: 3,
  };

  return [...matches].sort((a, b) => {
    const statusDiff =
      (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);

    if (statusDiff !== 0) return statusDiff;

    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();

    if (a.status === "finished") return bTime - aTime;
    return aTime - bTime;
  });
}

async function getPublicTeamsForFilters(selectedSeason = "all") {
  if (!hasDatabaseConfig()) return [] as Team[];

  const prisma = getPrismaClient();
  const dbTeamSeasons = await prisma.teamSeason.findMany({
    where: selectedSeason === "all" ? undefined : { seasonId: selectedSeason },
    orderBy: { team: { name: "asc" } },
    include: {
      team: true,
      competitions: {
        include: {
          competition: true,
          pot: true,
        },
      },
    },
  });

  return dbTeamSeasons
    .map((teamSeason: any) => {
      const visibleEntries = teamSeason.competitions.filter((entry: any) =>
        shouldShowCompetitionContent(mapPrismaCompetitionToPublic(entry.competition)),
      );

      if (!visibleEntries.length) return null;

      const primaryEntry = visibleEntries[0];

      return {
        id: teamSeason.team.id,
        slug: teamSeason.team.slug,
        seasonId: teamSeason.seasonId,
        competitionIds: visibleEntries.map((entry: any) => entry.competitionId),
        name: teamSeason.team.name,
        shortName: teamSeason.team.shortName,
        logo: teamSeason.team.logoUrl || defaultTeamLogo,
        community: teamSeason.team.community || "",
        coach: teamSeason.coachName || "TBC",
        captain: teamSeason.captainName || "TBC",
        pot: primaryEntry.pot?.number ?? primaryEntry.seed ?? 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        form: [],
      } satisfies Team;
    })
    .filter(Boolean) as Team[];
}

export function getPublicTeamStaticParams() {
  return [] as { slug: string }[];
}

export function getPublicPlayerStaticParams() {
  return [] as { slug: string }[];
}

export function getPublicMatchStaticParams() {
  return [] as { slug: string }[];
}

export async function getPublicNewsStaticParams() {
  if (!hasDatabaseConfig()) return [] as { slug: string }[];

  const prisma = getPrismaClient();
  const posts = await prisma.newsPost.findMany({ select: { slug: true } });

  return posts.map((post) => ({ slug: post.slug }));
}

export function buildKnockoutMatches() {
  return [] as BracketMatch[];
}

export async function getPublicHomeData(): Promise<PublicHomeData> {
  if (!hasDatabaseConfig()) return emptyHomeData;

  try {
    const prisma = getPrismaClient();
    const [
      dbLiveMatches,
      dbUpcomingMatches,
      dbFinishedMatches,
      dbNews,
      activeCompetitionCount,
      currentSeason,
      featuredCompetition,
      dbTopScorers,
    ] = await Promise.all([
      prisma.match.findMany({
        where: {
          status: { in: ["LIVE", "HALFTIME", "PENALTIES"] },
          competition: PUBLIC_COMPETITION_CONTENT_WHERE,
        },
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
        where: { status: "UPCOMING", competition: PUBLIC_COMPETITION_CONTENT_WHERE },
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
        where: { status: "FULLTIME", competition: PUBLIC_COMPETITION_CONTENT_WHERE },
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
      prisma.competition.count({ where: { status: "ACTIVE" } }),
      prisma.season.findFirst({ where: { isCurrent: true } }),
      prisma.competition.findFirst({
        where: { status: "ACTIVE", type: { not: "SUPER_CUP" } },
        orderBy: { name: "asc" },
        include: {
          teams: {
            include: { pot: true, teamSeason: { include: { team: true } } },
          },
          standings: {
            orderBy: { rank: "asc" },
            include: {
              competitionTeam: {
                include: { pot: true, teamSeason: { include: { team: true } } },
              },
            },
          },
        },
      }),
      prisma.playerStat.findMany({
        where: {
          goals: { gt: 0 },
          competition: PUBLIC_COMPETITION_CONTENT_WHERE,
        },
        orderBy: [{ goals: "desc" }, { assists: "desc" }],
        take: 6,
        include: {
          competition: true,
          squadPlayer: {
            include: {
              player: true,
              teamSeason: { include: { team: true } },
              playerStats: { include: { competition: true } },
            },
          },
        },
      }),
    ]);

    const featuredRows = featuredCompetition
      ? buildCompetitionSections([featuredCompetition])[0]?.teams.slice(0, 6) ?? []
      : [];

    return {
      liveMatches: dbLiveMatches.map(mapPrismaMatchToPublicMatch),
      upcomingMatches: dbUpcomingMatches.map(mapPrismaMatchToPublicMatch),
      finishedMatches: dbFinishedMatches.map(mapPrismaMatchToPublicMatch),
      recentNews: dbNews.map((post: any) => mapDbNewsPost(post)),
      featuredTableRows: featuredRows,
      featuredCompetitionName: featuredCompetition?.name ?? "Standings",
      topScorers: dbTopScorers.map((stat: any) =>
        mapSquadPlayerToPublicPlayer(
          stat.squadPlayer,
          stat.squadPlayer.teamSeason.team.id,
          stat.competitionId,
        ),
      ),
      activeCompetitionCount,
      currentSeasonLabel: currentSeason?.label ?? "No active season",
    };
  } catch (error) {
    console.error("Failed to load public home data:", error);
    return emptyHomeData;
  }
}

export async function getPublicCompetitions(): Promise<PublicCompetitionItem[]> {
  if (!hasDatabaseConfig()) return [];

  try {
    const prisma = getPrismaClient();
    const dbCompetitions = await prisma.competition.findMany({
      orderBy: [{ season: { startsAt: "desc" } }, { name: "asc" }],
      include: {
        standings: {
          orderBy: { rank: "asc" },
          take: 1,
          include: {
            competitionTeam: {
              include: { teamSeason: { include: { team: true } } },
            },
          },
        },
      },
    });

    return dbCompetitions.map((dbCompetition: any) => {
      const competition = mapPrismaCompetitionToPublic(dbCompetition);
      const leaderName = isPendingSuperCup(competition)
        ? "Pending qualifiers"
        : dbCompetition.standings[0]?.competitionTeam?.teamSeason?.team?.name ?? "Not started";

      return { ...competition, leaderName };
    });
  } catch (error) {
    console.error("Failed to load public competitions:", error);
    return [];
  }
}

export async function getPublicCompetitionDetail(slug: string) {
  if (!hasDatabaseConfig()) return null;

  try {
    const prisma = getPrismaClient();
    const dbCompetition = await prisma.competition.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      include: {
        teams: {
          include: { pot: true, teamSeason: { include: { team: true } } },
        },
        matches: {
          include: {
            competition: true,
            venue: true,
            homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
            awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
            events: true,
            penaltyAttempts: { include: { taker: { include: { player: true } } } },
          },
          orderBy: { kickoffAt: "asc" },
        },
        newsPosts: { orderBy: { publishDate: "desc" } },
        standings: {
          orderBy: { rank: "asc" },
          include: {
            competitionTeam: {
              include: { pot: true, teamSeason: { include: { team: true } } },
            },
          },
        },
      },
    });

    if (!dbCompetition) return null;

    const section = buildCompetitionSections([dbCompetition])[0];
    const competition = section.competition;
    const pendingSuperCup = isPendingSuperCup(competition);
    const mappedMatches = pendingSuperCup
      ? []
      : dbCompetition.matches.map(mapPrismaMatchToPublicMatch);
    const knockoutMatches = mappedMatches
      .filter((match) => match.stage !== "group")
      .map((match, index) => mapMatchToBracket(match, index + 1));

    return {
      competition,
      tableRows: section.teams,
      teams: section.teams,
      matches: mappedMatches,
      news: dbCompetition.newsPosts.map((post: any) =>
        mapDbNewsPost(post, dbCompetition),
      ),
      knockoutMatches,
      hasKnockout: knockoutMatches.length > 0,
    };
  } catch (error) {
    console.error("Failed to load competition detail:", error);
    return null;
  }
}

export async function getPublicTeamsData(filters?: {
  competition?: string;
  season?: string;
}) {
  if (!hasDatabaseConfig()) {
    return {
      teams: [] as Team[],
      sections: [] as Array<{
        competition: Competition;
        teams: Team[];
        topTeam: Team | null;
        totalGoals: number;
        isPendingSuperCup: boolean;
      }>,
      seasonsList: [] as Season[],
      competitionsList: [] as Competition[],
      topTeam: null as Team | null,
      totalGoals: 0,
      selectedCompetitionName: "All competitions",
    };
  }

  try {
    const prisma = getPrismaClient();
    const [dbSeasons, dbCompetitionOptions] = await Promise.all([
      prisma.season.findMany({
        orderBy: [{ isCurrent: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.competition.findMany({ orderBy: { name: "asc" } }),
    ]);
    const selectedCompetition = filters?.competition ?? "all";
    const selectedSeason = resolveSelectedSeason(filters, dbSeasons);
    const where: Record<string, unknown> = {};

    if (selectedSeason !== "all") where.seasonId = selectedSeason;
    if (selectedCompetition !== "all") {
      where.OR = [{ id: selectedCompetition }, { slug: selectedCompetition }];
    }

    const dbCompetitions = await prisma.competition.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        teams: {
          include: { pot: true, teamSeason: { include: { team: true } } },
        },
        standings: {
          orderBy: { rank: "asc" },
          include: {
            competitionTeam: {
              include: { pot: true, teamSeason: { include: { team: true } } },
            },
          },
        },
      },
    });

    const sections = buildCompetitionSections(dbCompetitions);
    const visibleTeams = sections.flatMap((section) => section.teams);
    const selectedCompetitionRecord = sections[0]?.competition;

    return {
      teams: visibleTeams,
      sections,
      seasonsList: dbSeasons.map(mapPrismaSeasonToPublic),
      competitionsList: dbCompetitionOptions.map(mapPrismaCompetitionToPublic),
      topTeam: [...visibleTeams].sort((a, b) => b.points - a.points)[0] ?? null,
      totalGoals: visibleTeams.reduce((sum, team) => sum + team.goalsFor, 0),
      selectedCompetitionName:
        selectedCompetition === "all"
          ? "All competitions"
          : selectedCompetitionRecord?.name ?? "Selected competition",
    };
  } catch (error) {
    console.error("Failed to load public teams:", error);
    return {
      teams: [],
      sections: [],
      seasonsList: [],
      competitionsList: [],
      topTeam: null,
      totalGoals: 0,
      selectedCompetitionName: "All competitions",
    };
  }
}

export async function getPublicTeamDetail(slug: string) {
  if (!hasDatabaseConfig()) return null;

  try {
    const prisma = getPrismaClient();
    const dbTeam = await prisma.team.findFirst({
      where: { slug },
      include: {
        seasons: {
          include: {
            season: true,
            squadPlayers: {
              orderBy: { squadNumber: "asc" },
              include: {
                player: true,
                playerStats: { include: { competition: true } },
              },
            },
            competitions: {
              include: {
                competition: true,
                pot: true,
                standings: true,
              },
            },
          },
        },
      },
    });

    if (!dbTeam) return null;

    const teamSeasons = [...dbTeam.seasons].sort((a: any, b: any) => {
      if (a.season.isCurrent !== b.season.isCurrent) return a.season.isCurrent ? -1 : 1;
      return new Date(b.season.startsAt ?? b.createdAt).getTime() - new Date(a.season.startsAt ?? a.createdAt).getTime();
    });
    const teamSeason = teamSeasons[0];
    if (!teamSeason) return null;

    const visibleEntries = teamSeason.competitions.filter((entry: any) =>
      shouldShowCompetitionContent(mapPrismaCompetitionToPublic(entry.competition)),
    );
    if (!visibleEntries.length) return null;

    const primaryEntry = visibleEntries[0];
    const team = {
      ...mapCompetitionTeamToPublicTeam(
        primaryEntry,
        primaryEntry.competitionId,
        primaryEntry.standings,
      ),
      competitionIds: visibleEntries.map((entry: any) => entry.competitionId),
    };
    const squad = teamSeason.squadPlayers.map((squadPlayer: any) =>
      mapSquadPlayerToPublicPlayer(squadPlayer, dbTeam.id),
    );
    const competitionTeamIds = visibleEntries.map((entry: any) => entry.id);
    const dbMatches = await prisma.match.findMany({
      where: {
        OR: [
          { homeCompetitionTeamId: { in: competitionTeamIds } },
          { awayCompetitionTeamId: { in: competitionTeamIds } },
        ],
        competition: PUBLIC_COMPETITION_CONTENT_WHERE,
      },
      orderBy: { kickoffAt: "asc" },
      include: {
        competition: true,
        venue: true,
        homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
        awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
        events: true,
        penaltyAttempts: { include: { taker: { include: { player: true } } } },
      },
    });

    return {
      team,
      players: squad,
      squad,
      matches: dbMatches.map(mapPrismaMatchToPublicMatch),
      competitions: visibleEntries.map((entry: any) =>
        mapPrismaCompetitionToPublic(entry.competition),
      ),
    };
  } catch (error) {
    console.error("Failed to load team detail:", error);
    return null;
  }
}

export async function getPublicPlayersData(filters?: {
  competition?: string;
  team?: string;
  position?: string;
  season?: string;
}) {
  if (!hasDatabaseConfig()) {
    return {
      players: [] as Player[],
      teamsList: [] as Team[],
      competitionsList: [] as Competition[],
      seasonsList: [] as Season[],
      positionsList: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    };
  }

  try {
    const prisma = getPrismaClient();
    const [dbSeasons, dbCompetitions] = await Promise.all([
      prisma.season.findMany({
        orderBy: [{ isCurrent: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.competition.findMany({ orderBy: { name: "asc" } }),
    ]);
    const selectedSeason = resolveSelectedSeason(filters, dbSeasons);
    const selectedCompetition = filters?.competition ?? "all";
    const selectedTeam = filters?.team ?? "all";
    const selectedPosition = filters?.position ?? "all";
    const dbSquadPlayers = await prisma.squadPlayer.findMany({
      where: selectedSeason === "all" ? undefined : { seasonId: selectedSeason },
      orderBy: [{ teamSeason: { team: { name: "asc" } } }, { squadNumber: "asc" }],
      include: {
        player: true,
        playerStats: { include: { competition: true } },
        teamSeason: {
          include: {
            team: true,
            competitions: { include: { competition: true, pot: true } },
          },
        },
      },
    });
    const teamsList = await getPublicTeamsForFilters(selectedSeason);
    const visiblePlayers = dbSquadPlayers
      .filter((squadPlayer: any) => {
        const visibleEntries = squadPlayer.teamSeason.competitions.filter(
          (entry: any) =>
            shouldShowCompetitionContent(mapPrismaCompetitionToPublic(entry.competition)),
        );
        const competitionIds = visibleEntries.map((entry: any) => entry.competitionId);

        const competitionSlugs = visibleEntries.map(
          (entry: any) => entry.competition.slug,
        );

        return (
          competitionIds.length > 0 &&
          (selectedCompetition === "all" ||
            competitionIds.includes(selectedCompetition) ||
            competitionSlugs.includes(selectedCompetition)) &&
          (selectedTeam === "all" || squadPlayer.teamSeason.teamId === selectedTeam) &&
          (selectedPosition === "all" ||
            mapPositionCategory(squadPlayer.positionCategory) === selectedPosition)
        );
      })
      .map((squadPlayer: any) =>
        mapSquadPlayerToPublicPlayer(
          squadPlayer,
          squadPlayer.teamSeason.teamId,
          selectedCompetition,
        ),
      );

    return {
      players: visiblePlayers,
      teamsList,
      competitionsList: dbCompetitions.map(mapPrismaCompetitionToPublic),
      seasonsList: dbSeasons.map(mapPrismaSeasonToPublic),
      positionsList: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    };
  } catch (error) {
    console.error("Failed to load public players:", error);
    return {
      players: [],
      teamsList: [],
      competitionsList: [],
      seasonsList: [],
      positionsList: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    };
  }
}

export async function getPublicPlayerDetail(slug: string) {
  if (!hasDatabaseConfig()) return null;

  try {
    const prisma = getPrismaClient();
    const dbPlayer = await prisma.player.findFirst({
      where: { slug },
      include: {
        squadPlayers: {
          include: {
            player: true,
            playerStats: { include: { competition: true } },
            teamSeason: {
              include: {
                team: true,
                season: true,
                competitions: {
                  include: { competition: true, pot: true, standings: true },
                },
              },
            },
          },
        },
      },
    });

    if (!dbPlayer || !dbPlayer.squadPlayers.length) return null;

    const squadPlayers = [...dbPlayer.squadPlayers].sort((a: any, b: any) => {
      const aCurrent = a.teamSeason.season.isCurrent ? 1 : 0;
      const bCurrent = b.teamSeason.season.isCurrent ? 1 : 0;
      return bCurrent - aCurrent;
    });
    const squadPlayer = squadPlayers[0];
    const visibleEntries = squadPlayer.teamSeason.competitions.filter((entry: any) =>
      shouldShowCompetitionContent(mapPrismaCompetitionToPublic(entry.competition)),
    );
    if (!visibleEntries.length) return null;

    const primaryEntry = visibleEntries[0];
    const player = mapSquadPlayerToPublicPlayer(
      squadPlayer,
      squadPlayer.teamSeason.teamId,
    );
    const team = {
      ...mapCompetitionTeamToPublicTeam(
        primaryEntry,
        primaryEntry.competitionId,
        primaryEntry.standings,
      ),
      competitionIds: visibleEntries.map((entry: any) => entry.competitionId),
    };
    const competitionTeamIds = visibleEntries.map((entry: any) => entry.id);
    const dbMatches = await prisma.match.findMany({
      where: {
        OR: [
          { homeCompetitionTeamId: { in: competitionTeamIds } },
          { awayCompetitionTeamId: { in: competitionTeamIds } },
        ],
        competition: PUBLIC_COMPETITION_CONTENT_WHERE,
      },
      orderBy: { kickoffAt: "desc" },
      take: 3,
      include: {
        competition: true,
        venue: true,
        homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
        awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
        events: true,
        penaltyAttempts: { include: { taker: { include: { player: true } } } },
      },
    });

    return {
      player,
      team,
      matches: dbMatches.map(mapPrismaMatchToPublicMatch),
    };
  } catch (error) {
    console.error("Failed to load player detail:", error);
    return null;
  }
}

export async function getPublicFixturesData(filters?: {
  competition?: string;
  season?: string;
  status?: string;
  team?: string;
  matchday?: string;
}) {
  if (!hasDatabaseConfig()) {
    return {
      matches: [] as Match[],
      seasonsList: [] as Season[],
      competitionsList: [] as Competition[],
      teamsList: [] as Team[],
      matchdays: [] as string[],
      hasLiveMatches: false,
    };
  }

  try {
    const prisma = getPrismaClient();
    const [dbMatches, dbCompetitions, dbSeasons] = await Promise.all([
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
      prisma.season.findMany({
        orderBy: [{ isCurrent: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    const selectedStatus = filters?.status ?? "all";
    const selectedCompetition = filters?.competition ?? "all";
    const selectedSeason = filters?.season ?? "all";
    const selectedTeam = filters?.team ?? "all";
    const selectedMatchday = filters?.matchday ?? "all";
    const mappedMatches = dbMatches
      .filter((match: any) =>
        shouldShowCompetitionContent(mapPrismaCompetitionToPublic(match.competition)),
      )
      .map(mapPrismaMatchToPublicMatch);
    const filteredMatches = mappedMatches.filter((match) => {
      return (
        (selectedStatus === "all" || match.status === selectedStatus) &&
        (selectedSeason === "all" || match.seasonId === selectedSeason) &&
        matchesCompetitionFilter(
          {
            id: match.competitionId,
            slug: match.competitionSlug ?? match.competitionId,
          },
          selectedCompetition,
        ) &&
        (selectedTeam === "all" ||
          match.homeTeamId === selectedTeam ||
          match.awayTeamId === selectedTeam) &&
        (selectedMatchday === "all" || match.matchday === selectedMatchday)
      );
    });
    const orderedMatches = sortFixturesForDefaultView(filteredMatches);

    return {
      matches: orderedMatches,
      seasonsList: dbSeasons.map(mapPrismaSeasonToPublic),
      competitionsList: dbCompetitions.map(mapPrismaCompetitionToPublic),
      teamsList: await getPublicTeamsForFilters(
        selectedSeason === "all" ? getCurrentSeasonId(dbSeasons) : selectedSeason,
      ),
      matchdays: Array.from(new Set(mappedMatches.map((match) => match.matchday))),
      hasLiveMatches: mappedMatches.some((match) => match.status === "live"),
    };
  } catch (error) {
    console.error("Failed to load public fixtures:", error);
    return {
      matches: [],
      seasonsList: [],
      competitionsList: [],
      teamsList: [],
      matchdays: [],
      hasLiveMatches: false,
    };
  }
}

export async function getPublicMatchDetail(slug: string) {
  if (!hasDatabaseConfig()) return null;

  try {
    const prisma = getPrismaClient();
    const dbMatch = await prisma.match.findFirst({
      where: { slug },
      include: {
        competition: true,
        venue: true,
        homeCompetitionTeam: {
          include: {
            pot: true,
            teamSeason: {
              include: {
                team: true,
                squadPlayers: { include: { player: true }, orderBy: { squadNumber: "asc" } },
              },
            },
          },
        },
        awayCompetitionTeam: {
          include: {
            pot: true,
            teamSeason: {
              include: {
                team: true,
                squadPlayers: { include: { player: true }, orderBy: { squadNumber: "asc" } },
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

    if (!dbMatch) return null;

    const competition = mapPrismaCompetitionToPublic(dbMatch.competition);
    if (!shouldShowCompetitionContent(competition)) return null;

    const match = mapPrismaMatchToPublicMatch(dbMatch);
    const venue: Venue = {
      id: dbMatch.venue.id,
      slug: dbMatch.venue.slug,
      name: dbMatch.venue.name,
      location: dbMatch.venue.location,
    };
    const mapSideToTeam = (side: "home" | "away"): Team => {
      const competitionTeam = dbMatch[`${side}CompetitionTeam`];
      const teamSeason = competitionTeam?.teamSeason;
      const rawTeam = teamSeason?.team;

      return {
        id: rawTeam?.id ?? getMatchTeamId(dbMatch, side),
        slug: rawTeam?.slug ?? getMatchTeamId(dbMatch, side),
        seasonId: dbMatch.seasonId,
        competitionIds: [dbMatch.competitionId],
        name: rawTeam?.name ?? getMatchTeamName(dbMatch, side),
        shortName: rawTeam?.shortName ?? getMatchTeamShort(dbMatch, side),
        logo: rawTeam?.logoUrl || defaultTeamLogo,
        community: rawTeam?.community || "",
        coach: teamSeason?.coachName || "TBC",
        captain: teamSeason?.captainName || "TBC",
        pot: competitionTeam?.pot?.number ?? competitionTeam?.seed ?? 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        form: [],
      };
    };
    const homeTeam = mapSideToTeam("home");
    const awayTeam = mapSideToTeam("away");
    const mapLineupPlayers = (
      competitionTeamId: string | null | undefined,
      teamId: string,
    ) => {
      const lineup = dbMatch.lineups.find(
        (item: any) => item.competitionTeamId === competitionTeamId,
      );

      return (lineup?.players ?? []).map((lineupPlayer: any) => {
        const squadPlayer = lineupPlayer.squadPlayer;

        return {
          id: squadPlayer.player.id,
          slug: squadPlayer.player.slug,
          teamId,
          name: squadPlayer.player.fullName,
          photo: squadPlayer.player.photoUrl || defaultPlayerPhoto,
          number: lineupPlayer.shirtNumber ?? squadPlayer.squadNumber,
          positionGroup: mapPositionCategory(squadPlayer.positionCategory),
          detailedPosition: lineupPlayer.position ?? squadPlayer.detailedPosition ?? "TBC",
          dateOfBirth: squadPlayer.player.dateOfBirth.toISOString().split("T")[0],
          appearances: 0,
          goals: 0,
          assists: 0,
          cleanSheets: 0,
          yellowCards: 0,
          redCards: 0,
        } satisfies Player;
      });
    };
    const homePlayers = mapLineupPlayers(dbMatch.homeCompetitionTeamId, homeTeam.id);
    const awayPlayers = mapLineupPlayers(dbMatch.awayCompetitionTeamId, awayTeam.id);
    const enrichedEvents = (dbMatch.events ?? []).map((event: any) => {
      const eventType = mapPrismaEventType(event);
      const rawTeamId =
        event.competitionTeamId === dbMatch.homeCompetitionTeamId
          ? homeTeam.id
          : event.competitionTeamId === dbMatch.awayCompetitionTeamId
            ? awayTeam.id
            : event.competitionTeam?.teamSeason?.team?.id || "";
      const teamId =
        eventType === "Own goal" && rawTeamId === homeTeam.id
          ? awayTeam.id
          : eventType === "Own goal" && rawTeamId === awayTeam.id
            ? homeTeam.id
            : rawTeamId;

      return {
        id: event.id,
        minute: event.minuteLabel || (event.minute ? `${event.minute}'` : "0'"),
        type: eventType,
        teamId,
        playerId: event.player?.player?.id || event.playerId || "",
        playerName: event.player?.player?.fullName || "Player",
        playerNumber: event.player?.squadNumber ?? null,
        assistPlayerName: event.assistPlayer?.player?.fullName || null,
        playerInName: event.playerIn?.player?.fullName || null,
        playerOutName: event.playerOut?.player?.fullName || null,
        note: event.note || null,
      };
    });
    const enrichedAttempts = (dbMatch.penaltyAttempts ?? []).map((attempt: any) => {
      const teamId =
        attempt.competitionTeamId === dbMatch.homeCompetitionTeamId
          ? homeTeam.id
          : attempt.competitionTeamId === dbMatch.awayCompetitionTeamId
            ? awayTeam.id
            : attempt.competitionTeam?.teamSeason?.team?.id || "";

      return {
        id: attempt.id,
        order: attempt.sequence,
        teamId,
        teamName: teamId === homeTeam.id ? homeTeam.shortName : awayTeam.shortName,
        playerId: attempt.taker?.player?.id || attempt.takerId,
        playerName: attempt.taker?.player?.fullName || "Taker",
        playerNumber: attempt.taker?.squadNumber ?? null,
        scored: attempt.scored,
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
  } catch (error) {
    console.error("Failed to load match detail:", error);
    return null;
  }
}

export async function getPublicNewsData(filters?: {
  competition?: string;
  season?: string;
}) {
  if (!hasDatabaseConfig()) {
    return { posts: [] as NewsPost[], seasonsList: [] as Season[], competitionsList: [] as Competition[] };
  }

  try {
    const prisma = getPrismaClient();
    const [dbSeasons, dbCompetitions] = await Promise.all([
      prisma.season.findMany({
        orderBy: [{ isCurrent: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.competition.findMany({ orderBy: { name: "asc" } }),
    ]);
    const selectedSeason = resolveSelectedSeason(filters, dbSeasons);
    const selectedCompetition = filters?.competition ?? "all";
    const where: Record<string, unknown> = {};

    if (selectedSeason !== "all") where.seasonId = selectedSeason;
    if (selectedCompetition !== "all") {
      where.competition = {
        OR: [{ id: selectedCompetition }, { slug: selectedCompetition }],
      };
    }

    const posts = await prisma.newsPost.findMany({
      where,
      orderBy: { publishDate: "desc" },
      include: { competition: true },
    });

    return {
      posts: posts.map((post: any) => mapDbNewsPost(post)),
      seasonsList: dbSeasons.map(mapPrismaSeasonToPublic),
      competitionsList: dbCompetitions.map(mapPrismaCompetitionToPublic),
    };
  } catch (error) {
    console.error("Failed to load public news:", error);
    return { posts: [], seasonsList: [], competitionsList: [] };
  }
}

export async function getPublicNewsDetail(slug: string) {
  if (!hasDatabaseConfig()) return null;

  try {
    const prisma = getPrismaClient();
    const post = await prisma.newsPost.findFirst({
      where: { slug },
      include: { competition: true },
    });

    if (!post) return null;

    return {
      post: mapDbNewsPost(post),
      competition: mapPrismaCompetitionToPublic(post.competition),
    };
  } catch (error) {
    console.error("Failed to load news detail:", error);
    return null;
  }
}

export async function getPublicTablesData(filters?: {
  competition?: string;
  season?: string;
}) {
  if (!hasDatabaseConfig()) {
    return {
      selectedCompetition: null as Competition | null,
      selectedCompetitionName: "All competitions",
      tableRows: [] as Team[],
      sections: [] as Array<{
        competition: Competition;
        teams: Team[];
        topTeam: Team | null;
        totalGoals: number;
        isPendingSuperCup: boolean;
      }>,
      seasonsList: [] as Season[],
      competitionsList: [] as Competition[],
    };
  }

  try {
    const prisma = getPrismaClient();
    const [dbSeasons, dbCompetitionOptions] = await Promise.all([
      prisma.season.findMany({
        orderBy: [{ isCurrent: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.competition.findMany({ orderBy: { name: "asc" } }),
    ]);
    const selectedCompetition = filters?.competition ?? "all";
    const selectedSeason = resolveSelectedSeason(filters, dbSeasons);
    const where: Record<string, unknown> = {};

    if (selectedSeason !== "all") where.seasonId = selectedSeason;
    if (selectedCompetition !== "all") {
      where.OR = [{ id: selectedCompetition }, { slug: selectedCompetition }];
    }

    const dbCompetitions = await prisma.competition.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        teams: {
          include: { pot: true, teamSeason: { include: { team: true } } },
        },
        standings: {
          orderBy: { rank: "asc" },
          include: {
            competitionTeam: {
              include: { pot: true, teamSeason: { include: { team: true } } },
            },
          },
        },
      },
    });
    const sections = buildCompetitionSections(dbCompetitions).filter((section) =>
      selectedCompetition === "all"
        ? shouldShowCompetitionContent(section.competition)
        : true,
    );
    const tableRows = sections.flatMap((section) => section.teams);
    const selectedCompetitionRecord = sections[0]?.competition ?? null;

    return {
      selectedCompetition: selectedCompetitionRecord,
      selectedCompetitionName:
        selectedCompetition === "all"
          ? "All competitions"
          : selectedCompetitionRecord?.name ?? "Selected competition",
      tableRows,
      sections,
      seasonsList: dbSeasons.map(mapPrismaSeasonToPublic),
      competitionsList: dbCompetitionOptions.map(mapPrismaCompetitionToPublic),
    };
  } catch (error) {
    console.error("Failed to load public tables:", error);
    return {
      selectedCompetition: null,
      selectedCompetitionName: "All competitions",
      tableRows: [],
      sections: [],
      seasonsList: [],
      competitionsList: [],
    };
  }
}

export async function getPublicStatisticsData(filters?: {
  competition?: string;
  season?: string;
}) {
  if (!hasDatabaseConfig()) {
    return {
      scorers: [] as Player[],
      assists: [] as Player[],
      cleanSheets: [] as Player[],
      seasonsList: [] as Season[],
      competitionsList: [] as Competition[],
    };
  }

  try {
    const prisma = getPrismaClient();
    const [dbSeasons, dbCompetitions] = await Promise.all([
      prisma.season.findMany({
        orderBy: [{ isCurrent: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.competition.findMany({ orderBy: { name: "asc" } }),
    ]);
    const selectedSeason = resolveSelectedSeason(filters, dbSeasons);
    const selectedCompetition = filters?.competition ?? "all";
    const stats = await prisma.playerStat.findMany({
      where: {
        ...(selectedSeason !== "all" ? { seasonId: selectedSeason } : {}),
        ...(selectedCompetition !== "all"
          ? {
              OR: [
                { competitionId: selectedCompetition },
                { competition: { slug: selectedCompetition } },
              ],
            }
          : {}),
      },
      include: {
        competition: true,
        squadPlayer: {
          include: {
            player: true,
            teamSeason: { include: { team: true } },
            playerStats: { include: { competition: true } },
          },
        },
      },
    });
    const visibleStats = stats.filter((stat: any) =>
      shouldShowCompetitionContent(mapPrismaCompetitionToPublic(stat.competition)),
    );
    const players = visibleStats.map((stat: any) =>
      mapSquadPlayerToPublicPlayer(
        stat.squadPlayer,
        stat.squadPlayer.teamSeason.team.id,
        selectedCompetition,
      ),
    );

    return {
      scorers: [...players].sort((a, b) => b.goals - a.goals),
      assists: [...players].sort((a, b) => b.assists - a.assists),
      cleanSheets: [...players].sort((a, b) => b.cleanSheets - a.cleanSheets),
      seasonsList: dbSeasons.map(mapPrismaSeasonToPublic),
      competitionsList: dbCompetitions.map(mapPrismaCompetitionToPublic),
    };
  } catch (error) {
    console.error("Failed to load public statistics:", error);
    return {
      scorers: [],
      assists: [],
      cleanSheets: [],
      seasonsList: [],
      competitionsList: [],
    };
  }
}

export async function getPublicVenuesData(): Promise<PublicVenueItem[]> {
  if (!hasDatabaseConfig()) return [];

  try {
    const prisma = getPrismaClient();
    const dbVenues = await prisma.venue.findMany({
      orderBy: { name: "asc" },
      include: {
        matches: { include: { competition: true } },
      },
    });

    return dbVenues.map((venue: any) => ({
      id: venue.id,
      name: venue.name,
      location: venue.location,
      matchCount: venue.matches.filter((match: any) =>
        shouldShowCompetitionContent(mapPrismaCompetitionToPublic(match.competition)),
      ).length,
    }));
  } catch (error) {
    console.error("Failed to load public venues:", error);
    return [];
  }
}

export async function getPublicAwardsData(filters?: {
  competition?: string;
  season?: string;
}) {
  if (!hasDatabaseConfig()) {
    return {
      records: [] as AwardRecord[],
      selectedSeason: "all",
      selectedCompetition: "all",
      seasonsList: [] as Season[],
      competitionsList: [] as Competition[],
    };
  }

  try {
    const prisma = getPrismaClient();
    const [dbSeasons, dbCompetitions] = await Promise.all([
      prisma.season.findMany({
        orderBy: [{ isCurrent: "desc" }, { startsAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.competition.findMany({ orderBy: { name: "asc" } }),
    ]);
    const selectedSeason = resolveSelectedSeason(filters, dbSeasons);
    const selectedCompetition = filters?.competition ?? "all";
    const where: Record<string, unknown> = {};

    if (selectedSeason !== "all") where.seasonId = selectedSeason;
    if (selectedCompetition !== "all") {
      where.OR = [
        { competitionId: selectedCompetition },
        { competition: { slug: selectedCompetition } },
      ];
    }

    const records = await prisma.awardRecord.findMany({
      where,
      orderBy: [{ season: { startsAt: "desc" } }, { createdAt: "desc" }],
      include: { competition: true },
    });

    return {
      records: records.map((record: any) => mapDbAwardRecord(record)),
      selectedSeason,
      selectedCompetition,
      seasonsList: dbSeasons.map(mapPrismaSeasonToPublic),
      competitionsList: dbCompetitions.map(mapPrismaCompetitionToPublic),
    };
  } catch (error) {
    console.error("Failed to load public awards:", error);
    return {
      records: [],
      selectedSeason: "all",
      selectedCompetition: "all",
      seasonsList: [],
      competitionsList: [],
    };
  }
}

export async function getPublicSearchData(query?: string) {
  const q = (query || "").toLowerCase().trim();
  const emptyResults = {
    q: query ?? "",
    teamResults: [] as Team[],
    playerResults: [] as Player[],
    matchResults: [] as Match[],
    newsResults: [] as NewsPost[],
  };

  if (!q || !hasDatabaseConfig()) return emptyResults;

  try {
    const prisma = getPrismaClient();
    const [dbTeams, dbPlayers, dbMatches, dbPosts] = await Promise.all([
      prisma.team.findMany({
        include: {
          seasons: {
            include: {
              competitions: { include: { competition: true, pot: true } },
            },
          },
        },
      }),
      prisma.squadPlayer.findMany({
        include: {
          player: true,
          playerStats: { include: { competition: true } },
          teamSeason: {
            include: {
              team: true,
              competitions: { include: { competition: true } },
            },
          },
        },
      }),
      prisma.match.findMany({
        include: {
          competition: true,
          venue: true,
          homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
          awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
          events: true,
          penaltyAttempts: { include: { taker: { include: { player: true } } } },
        },
        orderBy: { kickoffAt: "desc" },
        take: 50,
      }),
      prisma.newsPost.findMany({
        orderBy: { publishDate: "desc" },
        take: 50,
        include: { competition: true },
      }),
    ]);
    const teamResults = dbTeams
      .filter((team: any) => {
        const visibleEntries = team.seasons.flatMap((teamSeason: any) =>
          teamSeason.competitions.filter((entry: any) =>
            shouldShowCompetitionContent(mapPrismaCompetitionToPublic(entry.competition)),
          ),
        );
        return (
          visibleEntries.length > 0 &&
          (team.name.toLowerCase().includes(q) ||
            String(team.community ?? "").toLowerCase().includes(q))
        );
      })
      .map((team: any) => {
        const teamSeason = team.seasons[0];
        const visibleEntries = (teamSeason?.competitions ?? []).filter((entry: any) =>
          shouldShowCompetitionContent(mapPrismaCompetitionToPublic(entry.competition)),
        );
        const primaryEntry = visibleEntries[0];

        return {
          id: team.id,
          slug: team.slug,
          seasonId: teamSeason?.seasonId ?? "",
          competitionIds: visibleEntries.map((entry: any) => entry.competitionId),
          name: team.name,
          shortName: team.shortName,
          logo: team.logoUrl || defaultTeamLogo,
          community: team.community || "",
          coach: teamSeason?.coachName || "TBC",
          captain: teamSeason?.captainName || "TBC",
          pot: primaryEntry?.pot?.number ?? primaryEntry?.seed ?? 0,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
          form: [],
        } satisfies Team;
      });
    const playerResults = dbPlayers
      .filter((squadPlayer: any) => {
        const competitionIds = squadPlayer.teamSeason.competitions
          .filter((entry: any) =>
            shouldShowCompetitionContent(mapPrismaCompetitionToPublic(entry.competition)),
          )
          .map((entry: any) => entry.competitionId);
        return competitionIds.length > 0 && squadPlayer.player.fullName.toLowerCase().includes(q);
      })
      .map((squadPlayer: any) =>
        mapSquadPlayerToPublicPlayer(squadPlayer, squadPlayer.teamSeason.teamId),
      );
    const matchResults = dbMatches
      .filter((match: any) =>
        shouldShowCompetitionContent(mapPrismaCompetitionToPublic(match.competition)),
      )
      .map(mapPrismaMatchToPublicMatch)
      .filter((match) => {
        const haystack = [
          match.homeTeamName,
          match.awayTeamName,
          match.competitionName,
          match.matchday,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    const newsResults = dbPosts
      .map((post: any) => mapDbNewsPost(post))
      .filter((post) =>
        `${post.title} ${post.excerpt}`.toLowerCase().includes(q),
      );

    return {
      q: query ?? "",
      teamResults,
      playerResults,
      matchResults,
      newsResults,
    };
  } catch (error) {
    console.error("Failed to load public search:", error);
    return emptyResults;
  }
}

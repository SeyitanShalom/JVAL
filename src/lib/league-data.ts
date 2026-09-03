export type MatchStatus = "live" | "upcoming" | "finished" | "postponed";
export type CompetitionStatus = "upcoming" | "active" | "completed";
export type Stage =
  | "group"
  | "round-of-16"
  | "quarter-final"
  | "semi-final"
  | "third-place"
  | "final";
export type EventType =
  | "Goal"
  | "Assist"
  | "Yellow card"
  | "Red card"
  | "Substitution"
  | "Penalty scored"
  | "Penalty missed"
  | "Own goal"
  | "Disallowed goal"
  | "Note";

export type Season = {
  id: string;
  label: string;
  status: CompetitionStatus;
};

export type Competition = {
  id: string;
  slug: string;
  seasonId: string;
  name: string;
  type: "Local Government" | "State" | "Super Cup" | "Custom";
  status: CompetitionStatus;
  plannedTeams: number;
  potCount: number;
  opponentsPerPot: number;
  includeOwnPotOpponents: boolean;
  qualifiers: number;
  knockoutStart: "Quarter-final" | "Round of 16";
  description: string;
};

export type TeamCompetitionStats = {
  pot?: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: Array<"W" | "D" | "L">;
};

export type Team = {
  id: string;
  slug: string;
  seasonId: string;
  competitionIds: string[];
  name: string;
  shortName: string;
  logo: string;
  community: string;
  coach: string;
  captain: string;
  pot: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: Array<"W" | "D" | "L">;
  competitionStats?: Record<string, TeamCompetitionStats>;
};

export type Player = {
  id: string;
  slug: string;
  teamId: string;
  teamName?: string;
  name: string;
  photo: string;
  number: number;
  positionGroup: "Goalkeeper" | "Defender" | "Midfielder" | "Forward";
  detailedPosition: string;
  dateOfBirth: string;
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
};

export type Venue = {
  id: string;
  slug: string;
  name: string;
  location: string;
};

export type MatchEvent = {
  id: string;
  minute: string;
  type: EventType;
  teamId: string;
  playerId: string;
  assistPlayerId?: string;
};

export type PenaltyAttempt = {
  id?: string;
  order: number;
  teamId: string;
  playerId: string;
  scored: boolean;
};

export type Match = {
  id: string;
  slug: string;
  seasonId: string;
  competitionId: string;
  competitionSlug?: string;
  competitionName?: string;
  matchday: string;
  stage: Stage;
  status: MatchStatus;
  minute?: string;
  currentPeriod?: string;
  date: string;
  venueId: string;
  venueName?: string;
  venueLocation?: string;
  homeTeamId: string;
  homeTeamName?: string;
  homeTeamShort?: string;
  homeTeamLogo?: string;
  awayTeamId: string;
  awayTeamName?: string;
  awayTeamShort?: string;
  awayTeamLogo?: string;
  homeScore?: number;
  awayScore?: number;
  referee?: string;
  formationHome?: string;
  formationAway?: string;
  firstHalfStartedAt?: string;
  secondHalfStartedAt?: string;
  events: MatchEvent[];
  penalties?: {
    home: number;
    away: number;
    attempts: PenaltyAttempt[];
  };
};

export type NewsPost = {
  id: string;
  slug: string;
  competitionId: string;
  competitionName?: string | null;
  title: string;
  coverImage: string;
  publishDate: string;
  excerpt: string;
  content: string[];
};

export type AwardRecord = {
  id: string;
  seasonId: string;
  competitionId: string | null;
  competitionName?: string | null;
  title: string;
  winner: string;
  detail: string;
};

export const defaultTeamLogo = "/football club.png";
export const defaultPlayerPhoto = "/Profile.png";

export const seasons: Season[] = [];
export const competitions: Competition[] = [];
export const teams: Team[] = [];
export const players: Player[] = [];
export const venues: Venue[] = [];
export const matches: Match[] = [];
export const newsPosts: NewsPost[] = [];
export const awardsRecords: AwardRecord[] = [];

function slugify(value: string | null | undefined, fallback: string) {
  const slug = String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || fallback;
}

function titleize(value: string | null | undefined, fallback: string) {
  const text = String(value ?? "")
    .replace(/^(competition|team|venue|player)_/i, "")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!text) return fallback;

  return text
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getSeasonById(id: string | null | undefined) {
  return (
    seasons.find((season) => season.id === id || id?.includes(season.id)) ?? {
      id: id || "current-season",
      label: titleize(id, "Current Season"),
      status: "upcoming" as const,
    }
  );
}

export function getCompetitionById(id: string | null | undefined) {
  const clean = slugify(id, "competition");

  return (
    competitions.find(
      (c) =>
        c.id === id ||
        c.slug === id ||
        c.id === clean ||
        c.slug === clean ||
        Boolean(id && c.id.includes(id)),
    ) ?? {
      id: id || "competition",
      slug: clean,
      seasonId: "",
      name: titleize(id, "Competition"),
      type: "Local Government" as const,
      status: "upcoming" as const,
      plannedTeams: 0,
      potCount: 0,
      opponentsPerPot: 0,
      includeOwnPotOpponents: true,
      qualifiers: 0,
      knockoutStart: "Quarter-final" as const,
      description: "",
    }
  );
}

export function getCompetitionBySlug(slug: string | null | undefined) {
  return (
    competitions.find(
      (competition) => competition.slug === slug || competition.id === slug,
    ) ?? getCompetitionById(slug)
  );
}

export function getTeamById(id: string | null | undefined) {
  const clean = slugify(id, "team");

  return (
    teams.find(
      (t) =>
        t.id === id ||
        t.slug === id ||
        t.id === clean ||
        t.slug === clean ||
        t.id.replace(/-/g, "") === clean.replace(/-/g, "") ||
        t.slug.replace(/-/g, "") === clean.replace(/-/g, "") ||
        Boolean(id && id.toLowerCase().includes(t.id.toLowerCase())) ||
        Boolean(id && t.id.toLowerCase().includes(id.toLowerCase())),
    ) ?? {
      id: id || "team",
      slug: clean,
      seasonId: "",
      competitionIds: [],
      name: titleize(id, "Team"),
      shortName: titleize(id, "TBD").slice(0, 3).toUpperCase(),
      logo: defaultTeamLogo,
      community: "",
      coach: "TBC",
      captain: "TBC",
      pot: 0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      form: [] as Array<"W" | "D" | "L">,
    }
  );
}

export function getTeamBySlug(slug: string | null | undefined) {
  return teams.find((team) => team.slug === slug || team.id === slug);
}

export function getPlayerById(id: string | null | undefined) {
  return players.find((player) => player.id === id);
}

export function getPlayerBySlug(slug: string | null | undefined) {
  return players.find((player) => player.slug === slug);
}

export function getVenueById(id: string | null | undefined) {
  const clean = slugify(id, "venue");

  return (
    venues.find(
      (v) =>
        v.id === id ||
        v.slug === id ||
        v.id === clean ||
        v.slug === clean ||
        Boolean(id && id.toLowerCase().includes(v.id.toLowerCase())) ||
        Boolean(id && v.id.toLowerCase().includes(id.toLowerCase())),
    ) ?? {
      id: id || "venue",
      slug: clean,
      name: titleize(id, "Venue"),
      location: "",
    }
  );
}

export function getMatchBySlug(slug: string | null | undefined) {
  return matches.find((match) => match.slug === slug);
}

export function getNewsPostBySlug(slug: string | null | undefined) {
  return newsPosts.find((post) => post.slug === slug);
}

export function getTeamsForCompetition(competitionId: string) {
  return teams
    .filter((team) => team.competitionIds.includes(competitionId))
    .map((team) => getTeamCompetitionRow(team, competitionId));
}

function getTeamCompetitionRow(team: Team, competitionId: string): Team {
  const competitionStats = team.competitionStats?.[competitionId];

  if (!competitionStats) return team;

  return {
    ...team,
    ...competitionStats,
    pot: competitionStats.pot ?? team.pot,
  };
}

export function getPlayersForTeam(teamId: string) {
  return players.filter((player) => player.teamId === teamId);
}

export function getMatchesForCompetition(competitionId: string) {
  return matches.filter((match) => match.competitionId === competitionId);
}

export function getMatchesForTeam(teamId: string) {
  return matches.filter(
    (match) => match.homeTeamId === teamId || match.awayTeamId === teamId,
  );
}

export function getTableRows(competitionId = "") {
  return getTeamsForCompetition(competitionId).sort((a, b) => {
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

export function getTopScorers(limit?: number) {
  const sorted = [...players].sort(
    (a, b) => b.goals - a.goals || b.assists - a.assists,
  );
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getAssistLeaders(limit?: number) {
  const sorted = [...players].sort(
    (a, b) => b.assists - a.assists || b.goals - a.goals,
  );
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getCleanSheetLeaders(limit?: number) {
  const sorted = [...players].sort((a, b) => b.cleanSheets - a.cleanSheets);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function formatDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(parsed);
}

export function formatMatchTime(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "TBC";

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(parsed);
}

export function calculateAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 0;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

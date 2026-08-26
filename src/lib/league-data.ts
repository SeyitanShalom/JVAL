export type MatchStatus = "live" | "upcoming" | "finished" | "postponed";
export type CompetitionStatus = "upcoming" | "active" | "completed";
export type Stage = "group" | "round-of-16" | "quarter-final" | "semi-final" | "third-place" | "final";
export type EventType =
  | "Goal"
  | "Assist"
  | "Yellow card"
  | "Red card"
  | "Substitution"
  | "Penalty scored"
  | "Penalty missed"
  | "Own goal";

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
  type: "Local Government" | "Super Cup";
  status: CompetitionStatus;
  plannedTeams: number;
  potCount: number;
  qualifiers: number;
  knockoutStart: "Quarter-final" | "Round of 16";
  description: string;
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
};

export type Player = {
  id: string;
  slug: string;
  teamId: string;
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
  matchday: string;
  stage: Stage;
  status: MatchStatus;
  minute?: string;
  date: string;
  venueId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  referee?: string;
  formationHome?: string;
  formationAway?: string;
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
  title: string;
  coverImage: string;
  publishDate: string;
  excerpt: string;
  content: string[];
};

export type GalleryItem = {
  id: string;
  title: string;
  image: string;
  seasonId: string;
  competitionId?: string;
  matchId?: string;
  teamId?: string;
  playerId?: string;
  venueId?: string;
  scope: "Season" | "Competition" | "Match" | "Team" | "Player" | "Venue" | "General";
};

export type AwardRecord = {
  id: string;
  seasonId: string;
  competitionId: string;
  title: string;
  winner: string;
  detail: string;
};

export const seasons: Season[] = [
  { id: "2026-2027", label: "2026/2027", status: "active" },
  { id: "2025-2026", label: "2025/2026", status: "completed" },
  { id: "2024-2025", label: "2024/2025", status: "completed" },
];

export const competitions: Competition[] = [
  {
    id: "akure",
    slug: "akure-south-north",
    seasonId: "2026-2027",
    name: "Akure South & North",
    type: "Local Government",
    status: "active",
    plannedTeams: 28,
    potCount: 4,
    qualifiers: 8,
    knockoutStart: "Quarter-final",
    description:
      "A 28-team local government competition using pot-based group fixtures before the top eight move into the knockout rounds.",
  },
  {
    id: "ondo",
    slug: "ondo-ile-oluji",
    seasonId: "2026-2027",
    name: "Ondo & Ile-Oluji",
    type: "Local Government",
    status: "active",
    plannedTeams: 28,
    potCount: 4,
    qualifiers: 8,
    knockoutStart: "Quarter-final",
    description:
      "A combined competition for Ondo and Ile-Oluji teams, built around a single table and a quarter-final knockout path.",
  },
  {
    id: "idanre",
    slug: "idanre",
    seasonId: "2026-2027",
    name: "Idanre",
    type: "Local Government",
    status: "upcoming",
    plannedTeams: 10,
    potCount: 4,
    qualifiers: 8,
    knockoutStart: "Quarter-final",
    description:
      "A compact 10-team competition where pot assignments keep the group phase competitive before eight teams qualify.",
  },
  {
    id: "owo-ose",
    slug: "owo-ose",
    seasonId: "2026-2027",
    name: "Owo & Ose",
    type: "Local Government",
    status: "active",
    plannedTeams: 16,
    potCount: 4,
    qualifiers: 8,
    knockoutStart: "Quarter-final",
    description:
      "A 16-team local government competition with neutral venues, table ranking, and a quarter-final knockout stage.",
  },
  {
    id: "super-cup",
    slug: "super-cup",
    seasonId: "2026-2027",
    name: "Super Cup",
    type: "Super Cup",
    status: "upcoming",
    plannedTeams: 32,
    potCount: 4,
    qualifiers: 16,
    knockoutStart: "Round of 16",
    description:
      "The 32-team championship for top-eight qualifiers from each local government competition, ending with a final and third-place match.",
  },
];

export const teams: Team[] = [
  {
    id: "oyemekun",
    slug: "oyemekun-fc",
    seasonId: "2026-2027",
    competitionIds: ["akure"],
    name: "Oyemekun FC",
    shortName: "OYE",
    logo: "/football club.png",
    community: "Akure South",
    coach: "Coach Akin Adebayo",
    captain: "Tomiwa Aluko",
    pot: 1,
    played: 5,
    wins: 4,
    draws: 1,
    losses: 0,
    goalsFor: 13,
    goalsAgainst: 5,
    points: 13,
    form: ["W", "W", "D", "W", "W"],
  },
  {
    id: "aquinas",
    slug: "aquinas-fc",
    seasonId: "2026-2027",
    competitionIds: ["akure"],
    name: "Aquinas FC",
    shortName: "AQU",
    logo: "/football club.png",
    community: "Akure North",
    coach: "Coach Sunday Bello",
    captain: "Daniel Ojo",
    pot: 2,
    played: 5,
    wins: 3,
    draws: 2,
    losses: 0,
    goalsFor: 11,
    goalsAgainst: 6,
    points: 11,
    form: ["W", "D", "W", "D", "W"],
  },
  {
    id: "apex-united",
    slug: "apex-united",
    seasonId: "2026-2027",
    competitionIds: ["akure"],
    name: "Apex United",
    shortName: "APX",
    logo: "/football club.png",
    community: "Akure South",
    coach: "Coach Emmanuel Adeyemi",
    captain: "Boluwatife James",
    pot: 3,
    played: 5,
    wins: 3,
    draws: 1,
    losses: 1,
    goalsFor: 10,
    goalsAgainst: 7,
    points: 10,
    form: ["L", "W", "W", "D", "W"],
  },
  {
    id: "bright-stars",
    slug: "bright-stars-fc",
    seasonId: "2026-2027",
    competitionIds: ["akure"],
    name: "Bright Stars FC",
    shortName: "BST",
    logo: "/football club.png",
    community: "Akure North",
    coach: "Coach Femi Martins",
    captain: "Ilerioluwa Falade",
    pot: 4,
    played: 5,
    wins: 2,
    draws: 1,
    losses: 2,
    goalsFor: 8,
    goalsAgainst: 8,
    points: 7,
    form: ["W", "L", "D", "L", "W"],
  },
  {
    id: "ileoluji-stars",
    slug: "ile-oluji-stars",
    seasonId: "2026-2027",
    competitionIds: ["ondo"],
    name: "Ile-Oluji Stars",
    shortName: "IOS",
    logo: "/football club.png",
    community: "Ile-Oluji",
    coach: "Coach Peter Ajayi",
    captain: "Segun Afolabi",
    pot: 1,
    played: 5,
    wins: 4,
    draws: 0,
    losses: 1,
    goalsFor: 12,
    goalsAgainst: 6,
    points: 12,
    form: ["W", "W", "L", "W", "W"],
  },
  {
    id: "ondo-city",
    slug: "ondo-city-fc",
    seasonId: "2026-2027",
    competitionIds: ["ondo"],
    name: "Ondo City FC",
    shortName: "OCF",
    logo: "/football club.png",
    community: "Ondo",
    coach: "Coach Samuel Olanrewaju",
    captain: "Victor Aina",
    pot: 2,
    played: 5,
    wins: 3,
    draws: 0,
    losses: 2,
    goalsFor: 9,
    goalsAgainst: 7,
    points: 9,
    form: ["W", "L", "W", "L", "W"],
  },
  {
    id: "idanre-hills",
    slug: "idanre-hills-fc",
    seasonId: "2026-2027",
    competitionIds: ["idanre"],
    name: "Idanre Hills FC",
    shortName: "IDH",
    logo: "/football club.png",
    community: "Idanre",
    coach: "Coach Kayode Lawal",
    captain: "Ayo Martins",
    pot: 1,
    played: 4,
    wins: 3,
    draws: 1,
    losses: 0,
    goalsFor: 9,
    goalsAgainst: 3,
    points: 10,
    form: ["D", "W", "W", "W"],
  },
  {
    id: "owo-united",
    slug: "owo-united",
    seasonId: "2026-2027",
    competitionIds: ["owo-ose"],
    name: "Owo United",
    shortName: "OWO",
    logo: "/football club.png",
    community: "Owo",
    coach: "Coach Tunde Akande",
    captain: "Moses Ogunleye",
    pot: 1,
    played: 5,
    wins: 3,
    draws: 1,
    losses: 1,
    goalsFor: 10,
    goalsAgainst: 5,
    points: 10,
    form: ["W", "D", "W", "L", "W"],
  },
  {
    id: "ose-rangers",
    slug: "ose-rangers",
    seasonId: "2026-2027",
    competitionIds: ["owo-ose"],
    name: "Ose Rangers",
    shortName: "OSE",
    logo: "/football club.png",
    community: "Ose",
    coach: "Coach Gabriel Ade",
    captain: "Seyi Adeola",
    pot: 2,
    played: 5,
    wins: 2,
    draws: 2,
    losses: 1,
    goalsFor: 7,
    goalsAgainst: 6,
    points: 8,
    form: ["D", "W", "L", "W", "D"],
  },
  {
    id: "future-kings",
    slug: "future-kings",
    seasonId: "2026-2027",
    competitionIds: ["super-cup"],
    name: "Future Kings",
    shortName: "FKG",
    logo: "/football club.png",
    community: "Qualified Teams",
    coach: "Coach Isaac Tella",
    captain: "Samuel George",
    pot: 3,
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

export const players: Player[] = [
  {
    id: "benjamin-evans",
    slug: "benjamin-evans",
    teamId: "oyemekun",
    name: "Benjamin Evans",
    photo: "/Profile.png",
    number: 9,
    positionGroup: "Forward",
    detailedPosition: "ST",
    dateOfBirth: "2008-04-14",
    appearances: 5,
    goals: 7,
    assists: 2,
    cleanSheets: 0,
    yellowCards: 1,
    redCards: 0,
  },
  {
    id: "daniel-ojo",
    slug: "daniel-ojo",
    teamId: "aquinas",
    name: "Daniel Ojo",
    photo: "/Profile.png",
    number: 10,
    positionGroup: "Midfielder",
    detailedPosition: "AM",
    dateOfBirth: "2007-11-02",
    appearances: 5,
    goals: 4,
    assists: 5,
    cleanSheets: 0,
    yellowCards: 0,
    redCards: 0,
  },
  {
    id: "boluwatife-james",
    slug: "boluwatife-james",
    teamId: "apex-united",
    name: "Boluwatife James",
    photo: "/Profile.png",
    number: 7,
    positionGroup: "Forward",
    detailedPosition: "LW",
    dateOfBirth: "2008-01-22",
    appearances: 5,
    goals: 5,
    assists: 3,
    cleanSheets: 0,
    yellowCards: 1,
    redCards: 0,
  },
  {
    id: "tomiwa-aluko",
    slug: "tomiwa-aluko",
    teamId: "oyemekun",
    name: "Tomiwa Aluko",
    photo: "/Profile.png",
    number: 4,
    positionGroup: "Defender",
    detailedPosition: "CB",
    dateOfBirth: "2007-07-19",
    appearances: 5,
    goals: 1,
    assists: 1,
    cleanSheets: 2,
    yellowCards: 2,
    redCards: 0,
  },
  {
    id: "ayo-martins",
    slug: "ayo-martins",
    teamId: "idanre-hills",
    name: "Ayo Martins",
    photo: "/Profile.png",
    number: 1,
    positionGroup: "Goalkeeper",
    detailedPosition: "GK",
    dateOfBirth: "2007-09-09",
    appearances: 4,
    goals: 0,
    assists: 0,
    cleanSheets: 3,
    yellowCards: 0,
    redCards: 0,
  },
  {
    id: "victor-aina",
    slug: "victor-aina",
    teamId: "ondo-city",
    name: "Victor Aina",
    photo: "/Profile.png",
    number: 8,
    positionGroup: "Midfielder",
    detailedPosition: "CM",
    dateOfBirth: "2008-06-27",
    appearances: 5,
    goals: 3,
    assists: 4,
    cleanSheets: 0,
    yellowCards: 1,
    redCards: 0,
  },
  {
    id: "moses-ogunleye",
    slug: "moses-ogunleye",
    teamId: "owo-united",
    name: "Moses Ogunleye",
    photo: "/Profile.png",
    number: 11,
    positionGroup: "Forward",
    detailedPosition: "RW",
    dateOfBirth: "2007-12-16",
    appearances: 5,
    goals: 4,
    assists: 2,
    cleanSheets: 0,
    yellowCards: 0,
    redCards: 0,
  },
];

export const venues: Venue[] = [
  {
    id: "akure-township",
    slug: "akure-township-stadium",
    name: "Akure Township Stadium",
    location: "Akure, Ondo State",
  },
  {
    id: "ondo-sports-complex",
    slug: "ondo-sports-complex",
    name: "Ondo Sports Complex",
    location: "Ondo, Ondo State",
  },
  {
    id: "owo-community-field",
    slug: "owo-community-field",
    name: "Owo Community Field",
    location: "Owo, Ondo State",
  },
  {
    id: "idanre-center",
    slug: "idanre-football-center",
    name: "Idanre Football Center",
    location: "Idanre, Ondo State",
  },
];

export const matches: Match[] = [
  {
    id: "oyemekun-aquinas-live",
    slug: "oyemekun-fc-v-aquinas-fc",
    seasonId: "2026-2027",
    competitionId: "akure",
    matchday: "Matchday 5",
    stage: "group",
    status: "live",
    minute: "50'",
    date: "2026-09-12T15:00:00+01:00",
    venueId: "akure-township",
    homeTeamId: "oyemekun",
    awayTeamId: "aquinas",
    homeScore: 2,
    awayScore: 2,
    referee: "Mr. Adewale Johnson",
    formationHome: "4-3-3",
    formationAway: "4-2-3-1",
    events: [
      { id: "e1", minute: "12'", type: "Goal", teamId: "oyemekun", playerId: "benjamin-evans" },
      { id: "e2", minute: "24'", type: "Goal", teamId: "aquinas", playerId: "daniel-ojo" },
      { id: "e3", minute: "41'", type: "Yellow card", teamId: "oyemekun", playerId: "tomiwa-aluko" },
      { id: "e4", minute: "45+2'", type: "Goal", teamId: "oyemekun", playerId: "benjamin-evans" },
      { id: "e5", minute: "49'", type: "Goal", teamId: "aquinas", playerId: "daniel-ojo" },
    ],
  },
  {
    id: "apex-bright-stars",
    slug: "apex-united-v-bright-stars-fc",
    seasonId: "2026-2027",
    competitionId: "akure",
    matchday: "Matchday 5",
    stage: "group",
    status: "upcoming",
    date: "2026-09-12T17:30:00+01:00",
    venueId: "akure-township",
    homeTeamId: "apex-united",
    awayTeamId: "bright-stars",
    events: [],
  },
  {
    id: "ondo-ileoluji",
    slug: "ondo-city-fc-v-ile-oluji-stars",
    seasonId: "2026-2027",
    competitionId: "ondo",
    matchday: "Matchday 4",
    stage: "group",
    status: "upcoming",
    date: "2026-09-13T15:00:00+01:00",
    venueId: "ondo-sports-complex",
    homeTeamId: "ondo-city",
    awayTeamId: "ileoluji-stars",
    events: [],
  },
  {
    id: "owo-ose",
    slug: "owo-united-v-ose-rangers",
    seasonId: "2026-2027",
    competitionId: "owo-ose",
    matchday: "Matchday 4",
    stage: "group",
    status: "finished",
    date: "2026-09-07T16:00:00+01:00",
    venueId: "owo-community-field",
    homeTeamId: "owo-united",
    awayTeamId: "ose-rangers",
    homeScore: 3,
    awayScore: 1,
    events: [
      { id: "e6", minute: "9'", type: "Goal", teamId: "owo-united", playerId: "moses-ogunleye" },
      { id: "e7", minute: "37'", type: "Goal", teamId: "ose-rangers", playerId: "moses-ogunleye" },
      { id: "e8", minute: "72'", type: "Penalty scored", teamId: "owo-united", playerId: "moses-ogunleye" },
    ],
  },
  {
    id: "idanre-hills-penalties",
    slug: "idanre-hills-fc-v-ondo-city-fc",
    seasonId: "2026-2027",
    competitionId: "super-cup",
    matchday: "Quarter-final",
    stage: "quarter-final",
    status: "finished",
    date: "2026-11-21T16:00:00+01:00",
    venueId: "akure-township",
    homeTeamId: "idanre-hills",
    awayTeamId: "ondo-city",
    homeScore: 1,
    awayScore: 1,
    events: [
      { id: "e9", minute: "18'", type: "Goal", teamId: "idanre-hills", playerId: "ayo-martins" },
      { id: "e10", minute: "66'", type: "Goal", teamId: "ondo-city", playerId: "victor-aina" },
    ],
    penalties: {
      home: 4,
      away: 3,
      attempts: [
        { order: 1, teamId: "idanre-hills", playerId: "ayo-martins", scored: true },
        { order: 1, teamId: "ondo-city", playerId: "victor-aina", scored: true },
        { order: 2, teamId: "idanre-hills", playerId: "ayo-martins", scored: true },
        { order: 2, teamId: "ondo-city", playerId: "victor-aina", scored: false },
      ],
    },
  },
];

export const newsPosts: NewsPost[] = [
  {
    id: "season-launch",
    slug: "johnvents-apex-league-2026-2027-season-launch",
    competitionId: "akure",
    title: "Johnvents Apex League opens the 2026/2027 season",
    coverImage: "/still-life-colombian-national-soccer-team.jpg",
    publishDate: "2026-08-01",
    excerpt:
      "The new season begins with expanded competition coverage, neutral venues, and a sharper pathway into the Super Cup.",
    content: [
      "Johnvents Apex League returns for the 2026/2027 season with local government competitions feeding into the Super Cup.",
      "The tournament will use a pot-based group phase, automatic table ranking, knockout matches, and penalty shootouts where required.",
    ],
  },
  {
    id: "oyemekun-aquinas-report",
    slug: "oyemekun-and-aquinas-share-points",
    competitionId: "akure",
    title: "Oyemekun and Aquinas share points in Akure thriller",
    coverImage: "/Hero Image.png",
    publishDate: "2026-09-12",
    excerpt:
      "A fast group phase match stayed level deep into the second half as both teams traded goals and momentum.",
    content: [
      "Oyemekun FC and Aquinas FC delivered one of the liveliest fixtures of the current matchday.",
      "Both sides remain in the qualification places, with the top eight moving into the quarter-finals.",
    ],
  },
  {
    id: "super-cup-path",
    slug: "road-to-the-super-cup-confirmed",
    competitionId: "super-cup",
    title: "Road to the Super Cup confirmed",
    coverImage: "/still-life-colombian-national-soccer-team.jpg",
    publishDate: "2026-09-20",
    excerpt:
      "The top eight teams from each local government competition will qualify for the 32-team Super Cup.",
    content: [
      "The Super Cup will bring together qualified teams from Akure South & North, Ondo & Ile-Oluji, Idanre, and Owo & Ose.",
      "After the group phase, the top 16 teams will progress to the Round of 16.",
    ],
  },
];

export const galleryItems: GalleryItem[] = [
  {
    id: "gallery-1",
    title: "Opening matchday energy",
    image: "/still-life-colombian-national-soccer-team.jpg",
    seasonId: "2026-2027",
    competitionId: "akure",
    matchId: "oyemekun-aquinas-live",
    scope: "Match",
  },
  {
    id: "gallery-2",
    title: "Apex League branding",
    image: "/Hero Image.png",
    seasonId: "2026-2027",
    competitionId: "super-cup",
    scope: "Competition",
  },
  {
    id: "gallery-3",
    title: "Player profile session",
    image: "/Profile.png",
    seasonId: "2026-2027",
    teamId: "oyemekun",
    playerId: "benjamin-evans",
    scope: "Player",
  },
];

export const awardsRecords: AwardRecord[] = [
  {
    id: "champions",
    seasonId: "2025-2026",
    competitionId: "super-cup",
    title: "Champions",
    winner: "Apex United",
    detail: "Super Cup winners",
  },
  {
    id: "golden-boot",
    seasonId: "2026-2027",
    competitionId: "akure",
    title: "Golden Boot Race",
    winner: "Benjamin Evans",
    detail: "7 goals",
  },
  {
    id: "highest-scoring-match",
    seasonId: "2026-2027",
    competitionId: "owo-ose",
    title: "Highest Scoring Match",
    winner: "Owo United 3-1 Ose Rangers",
    detail: "4 goals",
  },
  {
    id: "golden-glove",
    seasonId: "2026-2027",
    competitionId: "idanre",
    title: "Golden Glove Race",
    winner: "Ayo Martins",
    detail: "3 clean sheets",
  },
];

export function getSeasonById(id: string) {
  return seasons.find((season) => season.id === id || id.includes(season.id)) ?? seasons[0];
}

export function getCompetitionById(id: string) {
  if (!id) return competitions[0];
  const clean = id.toLowerCase().replace(/competition_|_/g, "-");
  return (
    competitions.find(
      (c) =>
        c.id === id ||
        c.slug === id ||
        c.id === clean ||
        c.slug === clean ||
        id.includes(c.id) ||
        c.id.includes(id)
    ) ?? {
      id,
      slug: clean,
      seasonId: "2026-2027",
      name: id.replace(/competition_|_/g, " ").replace(/-/g, " ").toUpperCase(),
      type: "Local Government" as const,
      status: "active" as const,
      plannedTeams: 8,
      potCount: 4,
      qualifiers: 2,
      knockoutStart: "Quarter-final" as const,
      description: "Tournament Competition",
    }
  );
}

export function getCompetitionBySlug(slug: string) {
  return (
    competitions.find((competition) => competition.slug === slug || competition.id === slug) ??
    getCompetitionById(slug)
  );
}

export function getTeamById(id: string) {
  if (!id) return teams[0];
  const clean = id.toLowerCase().replace(/^team_|_fc$|fc_|_/g, "").replace(/_/g, "-");
  return (
    teams.find(
      (t) =>
        t.id === id ||
        t.slug === id ||
        t.id === clean ||
        t.slug === clean ||
        t.id.replace(/-/g, "") === clean.replace(/-/g, "") ||
        t.slug.replace(/-/g, "") === clean.replace(/-/g, "") ||
        id.toLowerCase().includes(t.id.toLowerCase()) ||
        t.id.toLowerCase().includes(id.toLowerCase())
    ) ?? {
      id,
      slug: clean,
      seasonId: "2026-2027",
      competitionIds: [],
      name: id.replace(/team_|_/g, " ").replace(/-/g, " ").toUpperCase(),
      shortName: id.slice(0, 3).toUpperCase(),
      logo: "/football club.png",
      community: "Akure",
      coach: "Head Coach",
      captain: "Captain",
      pot: 1,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
      form: [] as ("W" | "D" | "L")[],
    }
  );
}

export function getTeamBySlug(slug: string) {
  return teams.find((team) => team.slug === slug || team.id === slug) ?? getTeamById(slug);
}

export function getPlayerById(id: string) {
  return players.find((player) => player.id === id);
}

export function getPlayerBySlug(slug: string) {
  return players.find((player) => player.slug === slug);
}

export function getVenueById(id: string) {
  if (!id) return venues[0];
  const clean = id.toLowerCase().replace(/venue_|_/g, "-");
  return (
    venues.find(
      (v) =>
        v.id === id ||
        v.slug === id ||
        v.id === clean ||
        v.slug === clean ||
        id.toLowerCase().includes(v.id.toLowerCase()) ||
        v.id.toLowerCase().includes(id.toLowerCase())
    ) ?? {
      id,
      slug: clean,
      name: id.replace(/venue_|_/g, " ").replace(/-/g, " ").toUpperCase(),
      location: "Neutral Venue",
    }
  );
}

export function getMatchBySlug(slug: string) {
  return matches.find((match) => match.slug === slug);
}

export function getNewsPostBySlug(slug: string) {
  return newsPosts.find((post) => post.slug === slug);
}

export function getTeamsForCompetition(competitionId: string) {
  return teams.filter((team) => team.competitionIds.includes(competitionId));
}

export function getPlayersForTeam(teamId: string) {
  return players.filter((player) => player.teamId === teamId);
}

export function getMatchesForCompetition(competitionId: string) {
  return matches.filter((match) => match.competitionId === competitionId);
}

export function getMatchesForTeam(teamId: string) {
  return matches.filter((match) => match.homeTeamId === teamId || match.awayTeamId === teamId);
}

export function getTableRows(competitionId = "akure") {
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
  const sorted = [...players].sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getAssistLeaders(limit?: number) {
  const sorted = [...players].sort((a, b) => b.assists - a.assists || b.goals - a.goals);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function getCleanSheetLeaders(limit?: number) {
  const sorted = [...players].sort((a, b) => b.cleanSheets - a.cleanSheets);
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatMatchTime(date: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function calculateAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const now = new Date("2026-08-21T00:00:00+01:00");
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

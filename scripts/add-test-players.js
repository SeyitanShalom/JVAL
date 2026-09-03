/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

process.loadEnvFile?.();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to add test players.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const firstNames = [
  "Ayo",
  "Tomi",
  "Kola",
  "Dami",
  "Seyi",
  "Femi",
  "Tunde",
  "Wale",
  "Kunle",
  "Bayo",
  "Jide",
  "Dele",
  "Seun",
  "Tobi",
  "Mide",
  "Yemi",
  "Lekan",
  "Segun",
  "Kayode",
  "Bode",
  "Moses",
  "Samuel",
  "Daniel",
  "David",
  "Joshua",
  "Victor",
  "Caleb",
  "Elijah",
  "Isaac",
  "Nathan",
  "Simon",
  "Peter",
  "Michael",
  "Joseph",
  "Emmanuel",
  "Gabriel",
  "Raphael",
  "Stephen",
  "Philip",
  "Joel",
  "Noah",
  "Ethan",
  "Aaron",
  "Jordan",
  "Jason",
  "Kevin",
  "Dennis",
  "Marcus",
];

const middleNames = [
  "Ade",
  "Ola",
  "Ire",
  "Ife",
  "Tayo",
  "Tola",
  "Dara",
  "Fola",
  "Mayo",
  "Timi",
  "Niyi",
  "Tega",
  "Tope",
  "Nuel",
  "Jimi",
  "Ladi",
  "Sola",
  "Tade",
  "Mola",
  "Dayo",
  "Fayo",
  "Maro",
  "Sami",
  "Tito",
];

const lastNames = [
  "Adebayo",
  "Adeleke",
  "Adeyemi",
  "Ajayi",
  "Akintola",
  "Akinwale",
  "Ariyo",
  "Balogun",
  "Bamgboye",
  "Bello",
  "Daramola",
  "Fasuyi",
  "Folarin",
  "Ibitoye",
  "Idowu",
  "Jegede",
  "Lawal",
  "Makinde",
  "Ojo",
  "Okafor",
  "Okeke",
  "Oladipo",
  "Oladokun",
  "Olaniyan",
  "Olasupo",
  "Olawale",
  "Olumide",
  "Omotoso",
  "Onifade",
  "Owolabi",
  "Oyebanji",
  "Sanni",
  "Salami",
  "Taiwo",
  "Thomas",
  "Usman",
  "Williams",
  "Yakubu",
  "Yusuf",
  "Zubair",
];

const squadTemplate = new Map([
  [1, ["GOALKEEPER", "GK"]],
  [2, ["DEFENDER", "RB"]],
  [3, ["DEFENDER", "LB"]],
  [4, ["DEFENDER", "CB"]],
  [5, ["DEFENDER", "CB"]],
  [6, ["MIDFIELDER", "DM"]],
  [7, ["FORWARD", "RW"]],
  [8, ["MIDFIELDER", "CM"]],
  [9, ["FORWARD", "ST"]],
  [10, ["MIDFIELDER", "AM"]],
  [11, ["FORWARD", "LW"]],
  [12, ["GOALKEEPER", "GK"]],
  [13, ["DEFENDER", "RB"]],
  [14, ["DEFENDER", "CB"]],
  [15, ["DEFENDER", "CB"]],
  [16, ["DEFENDER", "LB"]],
  [17, ["MIDFIELDER", "CM"]],
  [18, ["MIDFIELDER", "DM"]],
  [19, ["MIDFIELDER", "AM"]],
  [20, ["MIDFIELDER", "CM"]],
  [21, ["FORWARD", "RW"]],
  [22, ["FORWARD", "LW"]],
  [23, ["GOALKEEPER", "GK"]],
  [24, ["FORWARD", "ST"]],
  [25, ["FORWARD", "ST"]],
]);

function slugify(value, fallback = "player") {
  const slug = String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || fallback;
}

function getPositionForSquadNumber(squadNumber) {
  return squadTemplate.get(squadNumber) ?? ["MIDFIELDER", "CM"];
}

function getDateOfBirth(seed) {
  const year = 2008 + (seed % 5);
  const month = String((seed % 12) + 1).padStart(2, "0");
  const day = String((seed % 27) + 1).padStart(2, "0");

  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

function makeName(seed, usedNames) {
  const totalMiddleLast = middleNames.length * lastNames.length;
  let candidateSeed = seed;

  while (candidateSeed < seed + firstNames.length * totalMiddleLast) {
    const first = firstNames[candidateSeed % firstNames.length];
    const middle =
      middleNames[Math.floor(candidateSeed / firstNames.length) % middleNames.length];
    const last =
      lastNames[Math.floor(candidateSeed / totalMiddleLast) % lastNames.length];
    const name = `${first} ${middle} ${last}`;

    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }

    candidateSeed++;
  }

  const fallback = `Test Player ${String(seed + 1).padStart(4, "0")}`;
  usedNames.add(fallback);
  return fallback;
}

async function updateCaptainName(teamSeasonId) {
  const teamSeason = await prisma.teamSeason.findUnique({
    where: { id: teamSeasonId },
    select: {
      captainName: true,
      squadPlayers: {
        where: { squadNumber: 10 },
        select: { player: { select: { fullName: true } } },
        take: 1,
      },
    },
  });

  const currentCaptain = teamSeason?.captainName?.trim();
  const numberTen = teamSeason?.squadPlayers[0]?.player.fullName;

  if (numberTen && (!currentCaptain || currentCaptain === "TBC")) {
    await prisma.teamSeason.update({
      where: { id: teamSeasonId },
      data: { captainName: numberTen },
    });
  }
}

async function addPlayersForTeamSeason(teamSeason, globalStartIndex, usedNames) {
  const squadLimit = Math.max(teamSeason.squadLimit || 25, 0);
  const occupiedNumbers = new Set(
    teamSeason.squadPlayers.map((player) => player.squadNumber),
  );
  const missingNumbers = [];

  for (let squadNumber = 1; squadNumber <= squadLimit; squadNumber++) {
    if (!occupiedNumbers.has(squadNumber)) {
      missingNumbers.push(squadNumber);
    }
  }

  if (!missingNumbers.length) {
    await updateCaptainName(teamSeason.id);
    return { createdCount: 0, finalCount: teamSeason.squadPlayers.length };
  }

  const candidates = missingNumbers.map((squadNumber, index) => {
    const [positionCategory, detailedPosition] =
      getPositionForSquadNumber(squadNumber);
    const slug = slugify(
      `${teamSeason.season.slug}-${teamSeason.team.slug}-test-player-${String(
        squadNumber,
      ).padStart(2, "0")}`,
    );
    const seed = globalStartIndex + index;

    return {
      slug,
      fullName: makeName(seed, usedNames),
      dateOfBirth: getDateOfBirth(seed),
      squadNumber,
      positionCategory,
      detailedPosition,
    };
  });

  await prisma.player.createMany({
    data: candidates.map((candidate) => ({
      slug: candidate.slug,
      fullName: candidate.fullName,
      photoUrl: "/Profile.png",
      dateOfBirth: candidate.dateOfBirth,
    })),
    skipDuplicates: true,
  });

  const players = await prisma.player.findMany({
    where: { slug: { in: candidates.map((candidate) => candidate.slug) } },
    select: { id: true, slug: true },
  });
  const playerBySlug = new Map(players.map((player) => [player.slug, player]));

  const squadEntries = await prisma.squadPlayer.createMany({
    data: candidates.flatMap((candidate) => {
      const player = playerBySlug.get(candidate.slug);
      if (!player) return [];

      return [
        {
          seasonId: teamSeason.seasonId,
          teamSeasonId: teamSeason.id,
          playerId: player.id,
          squadNumber: candidate.squadNumber,
          positionCategory: candidate.positionCategory,
          detailedPosition: candidate.detailedPosition,
        },
      ];
    }),
    skipDuplicates: true,
  });

  await updateCaptainName(teamSeason.id);

  return {
    createdCount: squadEntries.count,
    finalCount: teamSeason.squadPlayers.length + squadEntries.count,
  };
}

async function main() {
  const currentSeason = await prisma.season.findFirst({
    where: { isCurrent: true },
    select: { id: true, label: true },
  });

  if (!currentSeason) {
    console.log("No current season found. Mark a season as current first.");
    return;
  }

  const [teamSeasons, existingPlayers] = await Promise.all([
    prisma.teamSeason.findMany({
      where: { seasonId: currentSeason.id },
      orderBy: { team: { name: "asc" } },
      include: {
        season: { select: { slug: true, label: true } },
        team: { select: { slug: true, name: true } },
        squadPlayers: {
          select: { squadNumber: true },
          orderBy: { squadNumber: "asc" },
        },
      },
    }),
    prisma.player.findMany({ select: { fullName: true } }),
  ]);

  if (!teamSeasons.length) {
    console.log(`No teams found for current season ${currentSeason.label}.`);
    return;
  }

  const usedNames = new Set(existingPlayers.map((player) => player.fullName));
  const results = [];
  let globalPlayerIndex = existingPlayers.length;

  for (const teamSeason of teamSeasons) {
    const result = await addPlayersForTeamSeason(
      teamSeason,
      globalPlayerIndex,
      usedNames,
    );

    globalPlayerIndex += result.createdCount;
    results.push({
      team: teamSeason.team.name,
      squadLimit: teamSeason.squadLimit,
      ...result,
    });
  }

  const totalCreated = results.reduce(
    (sum, result) => sum + result.createdCount,
    0,
  );

  for (const result of results) {
    console.log(
      `${result.team}: ${result.finalCount}/${result.squadLimit} players` +
        (result.createdCount ? ` (+${result.createdCount})` : " (already full)"),
    );
  }

  console.log(`Created ${totalCreated} test squad players.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

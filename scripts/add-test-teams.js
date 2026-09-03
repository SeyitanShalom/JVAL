/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

process.loadEnvFile?.();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to add test teams.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const TEST_TEAM_COMMUNITY = "Test Community";

function slugify(value, fallback = "team") {
  const slug = String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || fallback;
}

function makeShortName(competitionName, index) {
  const initials = String(competitionName)
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .padEnd(2, "T")
    .slice(0, 2);

  return `${initials}${String(index).padStart(2, "0").slice(-2)}`;
}

async function addTeamsForCompetition(competition) {
  const plannedCount = Math.max(competition.plannedTeamCount, 0);
  const existingCount = competition._count.teams;
  const missingCount = Math.max(plannedCount - existingCount, 0);

  if (!missingCount) {
    return {
      competition: competition.name,
      plannedCount,
      existingCount,
      createdCount: 0,
    };
  }

  const assignedSlugs = new Set(
    competition.teams.map((entry) => entry.teamSeason.team.slug),
  );
  const candidates = [];
  let candidateIndex = 1;

  while (candidates.length < missingCount) {
    const label = String(candidateIndex).padStart(2, "0");
    const slug = slugify(
      `${competition.season.slug}-${competition.slug}-test-team-${label}`,
    );

    if (!assignedSlugs.has(slug)) {
      candidates.push({
        index: candidateIndex,
        label,
        slug,
        name: `${competition.name} Test Team ${label}`,
      });
    }

    candidateIndex++;

    if (candidateIndex > plannedCount + existingCount + missingCount + 100) {
      throw new Error(
        `Could not create enough unique test teams for ${competition.name}.`,
      );
    }
  }

  await prisma.team.createMany({
    data: candidates.map((candidate) => ({
      slug: candidate.slug,
      name: candidate.name,
      shortName: makeShortName(competition.name, candidate.index),
      logoUrl: "/football club.png",
      community: TEST_TEAM_COMMUNITY,
    })),
    skipDuplicates: true,
  });

  const teams = await prisma.team.findMany({
    where: { slug: { in: candidates.map((candidate) => candidate.slug) } },
    select: { id: true, slug: true },
  });
  const teamBySlug = new Map(teams.map((team) => [team.slug, team]));

  await prisma.teamSeason.createMany({
    data: candidates.flatMap((candidate) => {
      const team = teamBySlug.get(candidate.slug);
      if (!team) return [];

      return [
        {
          seasonId: competition.season.id,
          teamId: team.id,
          managerName: `Test Manager ${candidate.label}`,
          coachName: `Test Coach ${candidate.label}`,
          coachTwoName: `Assistant Coach ${candidate.label}`,
          captainName: "TBC",
          squadLimit: 25,
        },
      ];
    }),
    skipDuplicates: true,
  });

  const teamSeasons = await prisma.teamSeason.findMany({
    where: {
      seasonId: competition.season.id,
      teamId: { in: teams.map((team) => team.id) },
    },
    select: { id: true, teamId: true },
  });
  const teamSeasonByTeamId = new Map(
    teamSeasons.map((teamSeason) => [teamSeason.teamId, teamSeason]),
  );

  const entries = await prisma.competitionTeam.createMany({
    data: candidates.flatMap((candidate) => {
      const team = teamBySlug.get(candidate.slug);
      const teamSeason = team ? teamSeasonByTeamId.get(team.id) : null;

      if (!teamSeason) return [];

      return [
        {
          competitionId: competition.id,
          teamSeasonId: teamSeason.id,
        },
      ];
    }),
    skipDuplicates: true,
  });

  return {
    competition: competition.name,
    plannedCount,
    existingCount,
    createdCount: entries.count,
  };
}

async function main() {
  const competitions = await prisma.competition.findMany({
    orderBy: [{ season: { startsAt: "desc" } }, { name: "asc" }],
    include: {
      season: { select: { id: true, slug: true, label: true } },
      teams: {
        select: {
          teamSeason: {
            select: { team: { select: { slug: true } } },
          },
        },
      },
      _count: { select: { teams: true } },
    },
  });

  if (!competitions.length) {
    console.log("No competitions found. Create a season and competition first.");
    return;
  }

  const results = [];

  for (const competition of competitions) {
    results.push(await addTeamsForCompetition(competition));
  }

  const totalCreated = results.reduce(
    (sum, result) => sum + result.createdCount,
    0,
  );

  for (const result of results) {
    const finalCount = result.existingCount + result.createdCount;
    console.log(
      `${result.competition}: ${finalCount}/${result.plannedCount} teams` +
        (result.createdCount ? ` (+${result.createdCount})` : " (already full)"),
    );
  }

  console.log(`Created ${totalCreated} test team entries.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

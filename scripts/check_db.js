/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

process.loadEnvFile?.();

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to check the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const seasons = await prisma.season.findMany();
    console.log("Seasons count:", seasons.length);
    const comps = await prisma.competition.findMany();
    console.log("Competitions count:", comps.length);
    const teams = await prisma.team.findMany();
    console.log("Teams count:", teams.length);
    const matches = await prisma.match.findMany({
      include: {
        competition: true,
        homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
        awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
      },
    });
    console.log("Matches count in DB:", matches.length);
    console.log(
      "Matches list:",
      matches.map((m) => ({
        id: m.id,
        slug: m.slug,
        status: m.status,
        minuteLabel: m.minuteLabel,
        home: m.homeCompetitionTeam?.teamSeason?.team?.name || m.homeSourceLabel,
        away: m.awayCompetitionTeam?.teamSeason?.team?.name || m.awaySourceLabel,
      }))
    );
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

check();

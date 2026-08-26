import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function check() {
  try {
    const seasons = await prisma.season.findMany();
    console.log("=== SEASONS in DB ===", seasons.length, seasons.map(s => ({ id: s.id, label: s.label, isCurrent: s.isCurrent })));

    const comps = await prisma.competition.findMany();
    console.log("=== COMPETITIONS in DB ===", comps.length, comps.map(c => ({ id: c.id, slug: c.slug, name: c.name })));

    const teams = await prisma.team.findMany();
    console.log("=== TEAMS in DB ===", teams.length);

    const matches = await prisma.match.findMany({
      include: {
        competition: true,
        homeCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
        awayCompetitionTeam: { include: { teamSeason: { include: { team: true } } } },
      },
    });
    console.log("=== MATCHES in DB ===", matches.length);
    console.log("Matches detail:", matches.map(m => ({
      id: m.id,
      slug: m.slug,
      status: m.status,
      minuteLabel: m.minuteLabel,
      home: m.homeCompetitionTeam?.teamSeason?.team?.name || m.homeSourceLabel,
      away: m.awayCompetitionTeam?.teamSeason?.team?.name || m.awaySourceLabel,
      competitionId: m.competitionId,
      matchday: m.matchday,
    })));
  } catch (err) {
    console.error("DB Query error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
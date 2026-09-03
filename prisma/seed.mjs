import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is required to reset the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const cleanupSteps = [
    ["contact methods", () => prisma.contactMethod.deleteMany()],
    ["site content blocks", () => prisma.siteContentBlock.deleteMany()],
    ["awards and records", () => prisma.awardRecord.deleteMany()],
    ["gallery images", () => prisma.galleryImage.deleteMany()],
    ["news posts", () => prisma.newsPost.deleteMany()],
    ["match predictions", () => prisma.matchPrediction.deleteMany()],
    ["bracket slots", () => prisma.bracketSlot.deleteMany()],
    ["knockout brackets", () => prisma.knockoutBracket.deleteMany()],
    ["player stats", () => prisma.playerStat.deleteMany()],
    ["team stats", () => prisma.teamStat.deleteMany()],
    ["competition standings", () => prisma.competitionStanding.deleteMany()],
    ["penalty attempts", () => prisma.penaltyAttempt.deleteMany()],
    ["match events", () => prisma.matchEvent.deleteMany()],
    ["lineup players", () => prisma.matchLineupPlayer.deleteMany()],
    ["match lineups", () => prisma.matchLineup.deleteMany()],
    ["matches", () => prisma.match.deleteMany()],
    ["fixture generation runs", () => prisma.fixtureGenerationRun.deleteMany()],
    ["squad players", () => prisma.squadPlayer.deleteMany()],
    ["competition teams", () => prisma.competitionTeam.deleteMany()],
    ["players", () => prisma.player.deleteMany()],
    ["team seasons", () => prisma.teamSeason.deleteMany()],
    ["teams", () => prisma.team.deleteMany()],
    ["ranking rules", () => prisma.rankingRule.deleteMany()],
    ["competition pots", () => prisma.competitionPot.deleteMany()],
    ["competition groups", () => prisma.competitionGroup.deleteMany()],
    ["competition feeds", () => prisma.competitionFeed.deleteMany()],
    ["competitions", () => prisma.competition.deleteMany()],
    ["venues", () => prisma.venue.deleteMany()],
    ["seasons", () => prisma.season.deleteMany()],
  ];

  for (const [label, cleanup] of cleanupSteps) {
    const result = await cleanup();
    console.log(`Deleted ${result.count} ${label}.`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Cleared tournament placeholder data.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

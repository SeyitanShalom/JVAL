"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import type { MatchStage } from "@prisma/client";
import {
  distributeTeamsIntoPots,
  generateGroupStageFixtures,
  generateKnockoutBracket,
  buildSuperCup32Roster,
  type EngineTeam,
  type EngineVenue,
  type GeneratedFixture,
  type PotAllocation,
} from "@/lib/tournament-engine";

const BASE = "/admin/fixtures";

function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

function isPrismaErrorCode(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code?: unknown }).code) === code
  );
}

function getVenueSlotKey(venueId: string, kickoffAt: Date) {
  return `${venueId}:${kickoffAt.getTime()}`;
}

function slugifyLookupValue(value: string | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getCompetitionVenues<
  TCompetition extends { name: string; slug: string; type?: string },
  TVenue extends { name: string; slug: string; location: string },
>(competition: TCompetition, venues: TVenue[]) {
  const competitionSlug = slugifyLookupValue(
    competition.slug || competition.name,
  );

  return venues.filter((venue) => {
    const venueLookup = slugifyLookupValue(
      `${venue.slug} ${venue.name} ${venue.location}`,
    );

    return venueLookup.includes(competitionSlug);
  });
}

function getFixtureVenuesForCompetition<
  TCompetition extends { name: string; slug: string; type?: string },
  TVenue extends { name: string; slug: string; location: string },
>(competition: TCompetition, venues: TVenue[]) {
  const competitionVenues = getCompetitionVenues(competition, venues);

  if (competition.type === "LGA") return competitionVenues;

  return competitionVenues.length ? competitionVenues : venues;
}

async function findVenueTimeConflict(
  prisma: ReturnType<typeof getPrismaClient>,
  fixtures: GeneratedFixture[],
) {
  const generatedSlotKeys = new Set(
    fixtures.map((fixture) =>
      getVenueSlotKey(fixture.venueId, fixture.kickoffAt),
    ),
  );
  const venueIds = Array.from(new Set(fixtures.map((fixture) => fixture.venueId)));
  const kickoffTimes = Array.from(
    new Set(fixtures.map((fixture) => fixture.kickoffAt.getTime())),
    (time) => new Date(time),
  );

  const existingMatches = await prisma.match.findMany({
    where: {
      venueId: { in: venueIds },
      kickoffAt: { in: kickoffTimes },
    },
    select: {
      id: true,
      venueId: true,
      kickoffAt: true,
    },
  });

  return existingMatches.find((match) =>
    generatedSlotKeys.has(getVenueSlotKey(match.venueId, match.kickoffAt)),
  );
}

function findGeneratedVenueSlotConflict(fixtures: GeneratedFixture[]) {
  const generatedSlotKeys = new Set<string>();

  return fixtures.find((fixture) => {
    const slotKey = getVenueSlotKey(fixture.venueId, fixture.kickoffAt);

    if (generatedSlotKeys.has(slotKey)) {
      return true;
    }

    generatedSlotKeys.add(slotKey);
    return false;
  });
}

// ─── 1. AUTO-ASSIGN POTS ──────────────────────────────────────────────────────

export async function autoAssignPotsAction(competitionId: string) {
  await requireAdminPermission("manageTournamentStructure");

  if (!hasDatabaseConfig()) {
    redirect(`${BASE}?error=database`);
  }

  try {
    const prisma = getPrismaClient();

    // Fetch competition and enrolled teams
    const comp = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        teams: {
          include: {
            teamSeason: { include: { team: true } },
          },
        },
        pots: true,
      },
    });

    if (!comp || comp.teams.length === 0) {
      redirect(`${BASE}?error=no_teams`);
    }

    const potCount = Math.max(1, comp.potCount || 4);

    // Ensure the configured pots exist in database
    const potRecords: Record<number, string> = {};
    for (let i = 1; i <= potCount; i++) {
      let pot = comp.pots.find((p) => p.number === i);
      if (!pot) {
        pot = await prisma.competitionPot.create({
          data: {
            competitionId,
            number: i,
            name: `Pot ${i}`,
          },
        });
      }
      potRecords[i] = pot.id;
    }

    // Run engine distribution
    const engineTeams: EngineTeam[] = comp.teams.map((t) => ({
      id: t.id,
      name: t.teamSeason.team.name,
      shortName: t.teamSeason.team.shortName,
      community: t.teamSeason.team.community,
    }));

    const allocatedPots = distributeTeamsIntoPots(engineTeams, potCount, true);

    // Update each team's pot in DB
    for (const p of allocatedPots) {
      const potId = potRecords[p.potNumber];
      for (const t of p.teams) {
        await prisma.competitionTeam.update({
          where: { id: t.id },
          data: { potId },
        });
      }
    }
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirect(`${BASE}?error=pot_save`);
  }

  revalidatePath("/admin/competitions");
  revalidatePath(BASE);
  redirect(`${BASE}?pots_drawn=1`);
}

// ─── 2. GENERATE GROUP FIXTURES ───────────────────────────────────────────────

export async function generateGroupFixturesAction(formData: FormData) {
  await requireAdminPermission("manageTournamentStructure");

  if (!hasDatabaseConfig()) {
    redirect(`${BASE}?error=database`);
  }

  const competitionId = (formData.get("competitionId") as string | null)?.trim();
  const requestedMatchdays = parseInt((formData.get("matchdaysCount") as string) || "", 10);
  const matchdaysCount = Number.isNaN(requestedMatchdays) ? undefined : requestedMatchdays;
  const startDateStr = (formData.get("startDate") as string | null)?.trim();

  if (!competitionId) {
    redirect(`${BASE}?error=missing`);
  }

  try {
    const prisma = getPrismaClient();

    const [comp, dbVenues] = await Promise.all([
      prisma.competition.findUnique({
        where: { id: competitionId },
        include: {
          teams: {
            include: {
              teamSeason: { include: { team: true } },
              pot: true,
            },
          },
          pots: true,
        },
      }),
      prisma.venue.findMany(),
    ]);

    if (!comp || comp.teams.length < 2) {
      redirect(`${BASE}?error=no_teams`);
    }

    if (dbVenues.length === 0) {
      redirect(`${BASE}?error=no_venues`);
    }

    const competitionVenues = getFixtureVenuesForCompetition(comp, dbVenues);

    if (competitionVenues.length === 0) {
      redirect(`${BASE}?error=no_competition_venue`);
    }

    const existingFixtureCount = await prisma.match.count({
      where: { competitionId },
    });

    if (existingFixtureCount > 0) {
      redirect(`${BASE}?error=fixtures_exist`);
    }

    const potCount = Math.max(1, comp.potCount || 4);

    // Group teams into configured pots
    const pots: PotAllocation[] = [];
    for (let i = 1; i <= potCount; i++) {
      const potTeams = comp.teams
        .filter((t) => t.pot?.number === i)
        .map((t) => ({
          id: t.id,
          name: t.teamSeason.team.name,
          shortName: t.teamSeason.team.shortName,
          community: t.teamSeason.team.community,
          potNumber: i,
        }));

      pots.push({ potNumber: i, teams: potTeams });
    }

    // If assignments are missing or stale, auto-distribute on the fly
    const assignedTeamCount = pots.reduce((total, pot) => total + pot.teams.length, 0);
    const shouldPersistAutoPots = assignedTeamCount !== comp.teams.length;
    let finalPots = pots;

    if (shouldPersistAutoPots) {
      const engineTeams = comp.teams.map((t) => ({
        id: t.id,
        name: t.teamSeason.team.name,
        shortName: t.teamSeason.team.shortName,
        community: t.teamSeason.team.community,
      }));
      finalPots = distributeTeamsIntoPots(engineTeams, potCount, true);
    }

    const engineVenues: EngineVenue[] = competitionVenues.map((v) => ({
      id: v.id,
      name: v.name,
      location: v.location,
    }));

    const startDate = startDateStr ? new Date(startDateStr) : new Date();

    // Generate schedule
    const generated = generateGroupStageFixtures({
      competitionId,
      seasonId: comp.seasonId,
      pots: finalPots,
      venues: engineVenues,
      startDate,
      opponentsPerPot: comp.opponentsPerPot,
      includeOwnPotOpponents: comp.includeOwnPotOpponents,
      matchdaysCount,
    });

    const venueTimeConflict =
      findGeneratedVenueSlotConflict(generated) ??
      (await findVenueTimeConflict(prisma, generated));
    if (venueTimeConflict) {
      redirect(`${BASE}?error=fixture_time_conflict`);
    }

    // Save matches to DB in transaction
    await prisma.$transaction(async (tx) => {
      if (shouldPersistAutoPots) {
        const potRecords = new Map<number, string>();

        for (let i = 1; i <= potCount; i++) {
          const pot = await tx.competitionPot.upsert({
            where: { competitionId_number: { competitionId, number: i } },
            update: {},
            create: {
              competitionId,
              number: i,
              name: `Pot ${i}`,
            },
          });
          potRecords.set(i, pot.id);
        }

        for (const pot of finalPots) {
          const potId = potRecords.get(pot.potNumber);
          if (!potId || pot.teams.length === 0) continue;

          await tx.competitionTeam.updateMany({
            where: { id: { in: pot.teams.map((team) => team.id) } },
            data: { potId },
          });
        }
      }

      const generationRun = await tx.fixtureGenerationRun.create({
        data: {
          competitionId,
          mode: "AUTO",
          opponentsPerPot: comp.opponentsPerPot,
          includeOwnPot: comp.includeOwnPotOpponents,
          avoidSameAreaEarly: comp.avoidSameAreaEarly,
          notes: `League phase: ${potCount} pots, ${comp.opponentsPerPot} opponent(s) per eligible pot.`,
        },
      });

      await tx.match.createMany({
        data: generated.map((fix) => ({
          seasonId: comp.seasonId,
          competitionId,
          homeCompetitionTeamId: fix.homeTeamId,
          awayCompetitionTeamId: fix.awayTeamId,
          venueId: fix.venueId,
          slug: fix.slug,
          matchday: fix.matchday,
          stage: "GROUP",
          status: "UPCOMING",
          kickoffAt: fix.kickoffAt,
          neutralVenue: true,
          generationRunId: generationRun.id,
        })),
      });
    }, {
      timeout: 20_000,
    });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    if (isPrismaErrorCode(error, "P2002")) {
      redirect(`${BASE}?error=fixture_time_conflict`);
    }
    console.error("Unable to generate league phase fixtures", error);
    redirect(`${BASE}?error=fixture_gen_failed`);
  }

  revalidatePath("/admin/competitions");
  revalidatePath(BASE);
  revalidatePath("/fixtures");
  revalidatePath("/fixtures-results");
  revalidatePath("/");
  redirect(`${BASE}?fixtures_generated=1`);
}

// ─── 3. GENERATE KNOCKOUT BRACKET ─────────────────────────────────────────────

export async function generateKnockoutAction(competitionId: string) {
  await requireAdminPermission("manageTournamentStructure");

  if (!hasDatabaseConfig()) {
    redirect(`${BASE}?error=database`);
  }

  try {
    const prisma = getPrismaClient();

    const [comp, dbVenues, dbStandings] = await Promise.all([
      prisma.competition.findUnique({
        where: { id: competitionId },
        include: {
          teams: {
            include: { teamSeason: { include: { team: true } } },
          },
        },
      }),
      prisma.venue.findMany(),
      prisma.competitionStanding.findMany({
        where: { competitionId },
        orderBy: { rank: "asc" },
        include: {
          competitionTeam: {
            include: { teamSeason: { include: { team: true } } },
          },
        },
      }),
    ]);

    if (!comp) redirect(`${BASE}?error=missing`);
    if (dbVenues.length === 0) redirect(`${BASE}?error=no_venues`);

    const competitionVenues = getFixtureVenuesForCompetition(comp, dbVenues);

    if (competitionVenues.length === 0) {
      redirect(`${BASE}?error=no_competition_venue`);
    }

    // Determine top 8 teams
    let top8: EngineTeam[] = [];

    if (dbStandings.length >= 8) {
      top8 = dbStandings.slice(0, 8).map((s) => ({
        id: s.competitionTeam.id,
        name: s.competitionTeam.teamSeason.team.name,
        shortName: s.competitionTeam.teamSeason.team.shortName,
      }));
    } else {
      // If standings not finalized yet, seed by available enrolled teams
      top8 = comp.teams.slice(0, 8).map((t) => ({
        id: t.id,
        name: t.teamSeason.team.name,
        shortName: t.teamSeason.team.shortName,
      }));
    }

    if (top8.length < 8) {
      redirect(`${BASE}?error=need_8_teams`);
    }

    // Mark isQualifiedForKnockout = true on the top 8
    for (const t of top8) {
      await prisma.competitionTeam.update({
        where: { id: t.id },
        data: { isQualifiedForKnockout: true },
      });
    }

    const engineVenues: EngineVenue[] = competitionVenues.map((v) => ({
      id: v.id,
      name: v.name,
      location: v.location,
    }));

    const knockoutMatches = generateKnockoutBracket({
      competitionId,
      seasonId: comp.seasonId,
      top8RankedTeams: top8,
      venues: engineVenues,
      knockoutStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week from today
    });

    await prisma.$transaction(
      knockoutMatches.map((fix) =>
        prisma.match.create({
          data: {
            seasonId: comp.seasonId,
            competitionId,
            homeCompetitionTeamId: fix.homeTeamId,
            awayCompetitionTeamId: fix.awayTeamId,
            venueId: fix.venueId,
            slug: fix.slug,
            matchday: fix.matchday,
            stage: fix.stage as MatchStage,
            status: "UPCOMING",
            kickoffAt: fix.kickoffAt,
            neutralVenue: true,
          },
        })
      )
    );
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirect(`${BASE}?error=knockout_gen_failed`);
  }

  revalidatePath("/admin/competitions");
  revalidatePath(BASE);
  revalidatePath("/fixtures");
  revalidatePath("/fixtures-results");
  revalidatePath("/");
  redirect(`${BASE}?knockout_generated=1`);
}

// ─── 4. SEED SUPER CUP FROM LGAS ──────────────────────────────────────────────

export async function seedSuperCupAction(superCupCompetitionId: string) {
  await requireAdminPermission("manageTournamentStructure");

  if (!hasDatabaseConfig()) {
    redirect(`${BASE}?error=database`);
  }

  try {
    const prisma = getPrismaClient();

    // Fetch Super Cup competition
    const superCup = await prisma.competition.findUnique({
      where: { id: superCupCompetitionId },
      include: { pots: true },
    });

    if (!superCup) redirect(`${BASE}?error=missing`);

    // Fetch the 4 LGA competitions in the same season
    const lgaCompetitions = await prisma.competition.findMany({
      where: {
        seasonId: superCup.seasonId,
        id: { not: superCupCompetitionId },
      },
      include: {
        standings: {
          orderBy: { rank: "asc" },
          include: {
            competitionTeam: {
              include: { teamSeason: { include: { team: true } } },
            },
          },
        },
        teams: {
          include: { teamSeason: { include: { team: true } } },
        },
      },
    });

    const lgaResults = lgaCompetitions.map((lga) => {
      let top8: EngineTeam[] = [];
      if (lga.standings.length >= 8) {
        top8 = lga.standings.slice(0, 8).map((s) => ({
          id: s.competitionTeam.teamSeason.team.id,
          name: s.competitionTeam.teamSeason.team.name,
          shortName: s.competitionTeam.teamSeason.team.shortName,
        }));
      } else {
        top8 = lga.teams.slice(0, 8).map((t) => ({
          id: t.teamSeason.team.id,
          name: t.teamSeason.team.name,
          shortName: t.teamSeason.team.shortName,
        }));
      }

      return {
        competitionId: lga.id,
        competitionName: lga.name,
        top8Teams: top8,
      };
    });

    const { pots } = buildSuperCup32Roster(lgaResults);

    // Ensure Super Cup Pots 1-4 exist
    const potRecords: Record<number, string> = {};
    for (let i = 1; i <= 4; i++) {
      let pot = superCup.pots.find((p) => p.number === i);
      if (!pot) {
        pot = await prisma.competitionPot.create({
          data: {
            competitionId: superCupCompetitionId,
            number: i,
            name: `Super Cup Pot ${i}`,
          },
        });
      }
      potRecords[i] = pot.id;
    }

    // Enroll all 32 teams into Super Cup with teamSeason link and Pot
    for (const p of pots) {
      const potId = potRecords[p.potNumber];
      for (const t of p.teams) {
        // Find teamSeasonId
        const teamSeason = await prisma.teamSeason.findFirst({
          where: {
            seasonId: superCup.seasonId,
            teamId: t.id,
          },
        });

        if (teamSeason) {
          await prisma.competitionTeam.upsert({
            where: {
              competitionId_teamSeasonId: {
                competitionId: superCupCompetitionId,
                teamSeasonId: teamSeason.id,
              },
            },
            create: {
              competitionId: superCupCompetitionId,
              teamSeasonId: teamSeason.id,
              potId,
              isQualifiedForNextCompetition: true,
            },
            update: {
              potId,
              isQualifiedForNextCompetition: true,
            },
          });
        }
      }
    }
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirect(`${BASE}?error=supercup_seed_failed`);
  }

  revalidatePath("/admin/competitions");
  revalidatePath(BASE);
  redirect(`${BASE}?supercup_seeded=1`);
}

// ─── 5. CLEAR FIXTURES ────────────────────────────────────────────────────────

export async function clearCompetitionFixturesAction(competitionId: string) {
  await requireAdminPermission("deleteCriticalData");

  if (!hasDatabaseConfig()) {
    redirect(`${BASE}?error=database`);
  }

  try {
    const prisma = getPrismaClient();
    await prisma.match.deleteMany({
      where: {
        competitionId,
        status: "UPCOMING",
      },
    });
  } catch {
    redirect(`${BASE}?error=clear_failed`);
  }

  revalidatePath(BASE);
  revalidatePath("/fixtures");
  revalidatePath("/fixtures-results");
  revalidatePath("/");
  redirect(`${BASE}?fixtures_cleared=1`);
}

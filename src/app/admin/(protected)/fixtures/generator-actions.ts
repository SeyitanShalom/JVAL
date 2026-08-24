"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import {
  distributeTeamsIntoPots,
  generateGroupStageFixtures,
  generateKnockoutBracket,
  buildSuperCup32Roster,
  type EngineTeam,
  type EngineVenue,
  type PotAllocation,
} from "@/lib/tournament-engine";

const BASE = "/admin/fixtures";

// ─── 1. AUTO-ASSIGN POTS ──────────────────────────────────────────────────────

export async function autoAssignPotsAction(competitionId: string) {
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

    // Ensure Pots 1, 2, 3, 4 exist in database
    const potRecords: Record<number, string> = {};
    for (let i = 1; i <= 4; i++) {
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
    }));

    const allocatedPots = distributeTeamsIntoPots(engineTeams, 4, true);

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
  } catch {
    redirect(`${BASE}?error=pot_save`);
  }

  revalidatePath("/admin/competitions");
  revalidatePath(BASE);
  redirect(`${BASE}?pots_drawn=1`);
}

// ─── 2. GENERATE GROUP FIXTURES ───────────────────────────────────────────────

export async function generateGroupFixturesAction(formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect(`${BASE}?error=database`);
  }

  const competitionId = (formData.get("competitionId") as string | null)?.trim();
  const matchdaysCount = parseInt((formData.get("matchdaysCount") as string) || "4", 10);
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

    // Group teams into pots
    const pots: PotAllocation[] = [];
    for (let i = 1; i <= 4; i++) {
      const potTeams = comp.teams
        .filter((t) => t.pot?.number === i)
        .map((t) => ({
          id: t.id,
          name: t.teamSeason.team.name,
          shortName: t.teamSeason.team.shortName,
          potNumber: i,
        }));

      pots.push({ potNumber: i, teams: potTeams });
    }

    // If pots are empty, auto-distribute them on the fly
    const hasEmptyPots = pots.every((p) => p.teams.length === 0);
    let finalPots = pots;

    if (hasEmptyPots) {
      const engineTeams = comp.teams.map((t) => ({
        id: t.id,
        name: t.teamSeason.team.name,
        shortName: t.teamSeason.team.shortName,
      }));
      finalPots = distributeTeamsIntoPots(engineTeams, 4, true);
    }

    const engineVenues: EngineVenue[] = dbVenues.map((v) => ({
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
      matchdaysCount,
    });

    // Save matches to DB in transaction
    await prisma.$transaction(
      generated.map((fix) =>
        prisma.match.create({
          data: {
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
          },
        })
      )
    );
  } catch {
    redirect(`${BASE}?error=fixture_gen_failed`);
  }

  revalidatePath("/admin/competitions");
  revalidatePath(BASE);
  redirect(`${BASE}?fixtures_generated=1`);
}

// ─── 3. GENERATE KNOCKOUT BRACKET ─────────────────────────────────────────────

export async function generateKnockoutAction(competitionId: string) {
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

    const engineVenues: EngineVenue[] = dbVenues.map((v) => ({
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
            stage: fix.stage as any,
            status: "UPCOMING",
            kickoffAt: fix.kickoffAt,
            neutralVenue: true,
          },
        })
      )
    );
  } catch {
    redirect(`${BASE}?error=knockout_gen_failed`);
  }

  revalidatePath("/admin/competitions");
  revalidatePath(BASE);
  redirect(`${BASE}?knockout_generated=1`);
}

// ─── 4. SEED SUPER CUP FROM LGAS ──────────────────────────────────────────────

export async function seedSuperCupAction(superCupCompetitionId: string) {
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

    const { roster, pots } = buildSuperCup32Roster(lgaResults);

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
  } catch {
    redirect(`${BASE}?error=supercup_seed_failed`);
  }

  revalidatePath("/admin/competitions");
  revalidatePath(BASE);
  redirect(`${BASE}?supercup_seeded=1`);
}

// ─── 5. CLEAR FIXTURES ────────────────────────────────────────────────────────

export async function clearCompetitionFixturesAction(competitionId: string) {
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
  redirect(`${BASE}?fixtures_cleared=1`);
}

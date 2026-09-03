"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "team"
  );
}

async function getUniqueTeamSlug(name: string, currentTeamId?: string) {
  const prisma = getPrismaClient();
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (
    await prisma.team.findFirst({
      where: { slug, ...(currentTeamId ? { id: { not: currentTeamId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  return slug;
}

function getSelectedCompetitionIds(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("competitionIds")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );
}

async function syncTeamCompetitionEntries(
  prisma: ReturnType<typeof getPrismaClient>,
  teamSeasonId: string,
  seasonId: string,
  selectedCompetitionIds: string[],
) {
  const currentSeasonCompetitions = await prisma.competition.findMany({
    where: { seasonId },
    select: { id: true },
  });
  const currentSeasonCompetitionIds = currentSeasonCompetitions.map(
    (competition) => competition.id,
  );
  const validSelectedCompetitionIds = currentSeasonCompetitionIds.filter((id) =>
    selectedCompetitionIds.includes(id),
  );
  const validSelectedSet = new Set(validSelectedCompetitionIds);
  const competitionsToRemove = currentSeasonCompetitionIds.filter(
    (id) => !validSelectedSet.has(id),
  );

  if (competitionsToRemove.length) {
    await prisma.competitionTeam.deleteMany({
      where: {
        teamSeasonId,
        competitionId: { in: competitionsToRemove },
      },
    });
  }

  if (!validSelectedCompetitionIds.length) return;

  const existingEntries = await prisma.competitionTeam.findMany({
    where: {
      teamSeasonId,
      competitionId: { in: validSelectedCompetitionIds },
    },
    select: { competitionId: true },
  });
  const existingIds = new Set(
    existingEntries.map((entry) => entry.competitionId),
  );
  const competitionsToCreate = validSelectedCompetitionIds.filter(
    (competitionId) => !existingIds.has(competitionId),
  );

  if (!competitionsToCreate.length) return;

  await prisma.competitionTeam.createMany({
    data: competitionsToCreate.map((competitionId) => ({
      competitionId,
      teamSeasonId,
    })),
    skipDuplicates: true,
  });
}

async function ensureDatabaseReady() {
  await requireAdminPermission("manageTeams");

  if (!hasDatabaseConfig()) {
    redirect("/admin/teams?error=database");
  }
}

function isNextRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

export async function createTeam(formData: FormData) {
  await ensureDatabaseReady();

  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("shortName") ?? "").trim().toUpperCase();
  const community = String(formData.get("community") ?? "").trim();
  const managerName = String(formData.get("managerName") ?? "").trim();
  const coachName = String(formData.get("coachName") ?? "").trim();
  const coachTwoName = String(formData.get("coachTwoName") ?? "").trim();
  const captainName = String(formData.get("captainName") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim() || "/football club.png";
  const competitionIds = getSelectedCompetitionIds(formData);

  if (!name || !shortName || !community) {
    redirect("/admin/teams?error=missing");
  }

  const prisma = getPrismaClient();

  try {
    const currentSeason = await prisma.season.findFirst({
      where: { isCurrent: true },
      select: { id: true },
    });

    if (!currentSeason) {
      redirect("/admin/teams?error=no-season");
    }

    const slug = await getUniqueTeamSlug(name);

    const team = await prisma.team.create({
      data: {
        slug,
        name,
        shortName,
        logoUrl,
        community,
        seasons: {
          create: {
            seasonId: currentSeason.id,
            managerName: managerName || null,
            coachName: coachName || "TBC",
            coachTwoName: coachTwoName || null,
            captainName: captainName || "TBC",
            squadLimit: 25,
          },
        },
      },
      include: {
        seasons: {
          where: { seasonId: currentSeason.id },
          select: { id: true, seasonId: true },
        },
      },
    });

    const teamSeason = team.seasons[0];
    if (teamSeason) {
      await syncTeamCompetitionEntries(
        prisma,
        teamSeason.id,
        teamSeason.seasonId,
        competitionIds,
      );
    }
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error("Unable to create team", error);
    redirect("/admin/teams?error=save");
  }

  revalidatePath("/admin/teams");
  revalidatePath("/admin/competitions");
  revalidatePath("/admin/fixtures");
  redirect("/admin/teams?created=1");
}

export async function updateTeam(teamSeasonId: string, formData: FormData) {
  await ensureDatabaseReady();

  const managerName = String(formData.get("managerName") ?? "").trim();
  const coachName = String(formData.get("coachName") ?? "").trim();
  const coachTwoName = String(formData.get("coachTwoName") ?? "").trim();
  const captainName = String(formData.get("captainName") ?? "").trim();
  const community = String(formData.get("community") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const competitionIds = getSelectedCompetitionIds(formData);

  const prisma = getPrismaClient();

  try {
    const teamSeason = await prisma.teamSeason.update({
      where: { id: teamSeasonId },
      data: {
        managerName: managerName || null,
        coachName: coachName || "TBC",
        coachTwoName: coachTwoName || null,
        captainName: captainName || "TBC",
        team: {
          update: {
            community: community || undefined,
            logoUrl: logoUrl || undefined,
          },
        },
      },
      select: { id: true, seasonId: true },
    });

    if (formData.get("competitionIdsSubmitted")) {
      await syncTeamCompetitionEntries(
        prisma,
        teamSeason.id,
        teamSeason.seasonId,
        competitionIds,
      );
    }
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error("Unable to update team", error);
    redirect("/admin/teams?error=save");
  }

  revalidatePath("/admin/teams");
  revalidatePath("/admin/competitions");
  revalidatePath("/admin/fixtures");
  redirect("/admin/teams?updated=1");
}

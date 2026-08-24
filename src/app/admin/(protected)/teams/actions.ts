"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

function ensureDatabaseReady() {
  if (!hasDatabaseConfig()) {
    redirect("/admin/teams?error=database");
  }
}

function getTeamInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("shortName") ?? "").trim().toUpperCase();
  const community = String(formData.get("community") ?? "").trim();
  const coachName = String(formData.get("coachName") ?? "").trim();
  const captainName = String(formData.get("captainName") ?? "").trim();
  const teamSeasonId = String(formData.get("teamSeasonId") ?? "").trim();

  if (!name || !shortName || !community) {
    return null;
  }

  return { name, shortName, community, coachName, captainName, teamSeasonId };
}

export async function createTeam(formData: FormData) {
  ensureDatabaseReady();

  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("shortName") ?? "").trim().toUpperCase();
  const community = String(formData.get("community") ?? "").trim();
  const coachName = String(formData.get("coachName") ?? "").trim();
  const captainName = String(formData.get("captainName") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim() || "/football club.png";

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

    await prisma.team.create({
      data: {
        slug,
        name,
        shortName,
        logoUrl,
        community,
        seasons: {
          create: {
            seasonId: currentSeason.id,
            coachName: coachName || "TBC",
            captainName: captainName || "TBC",
            squadLimit: 25,
          },
        },
      },
    });
  } catch (error) {
    console.error("Unable to create team", error);
    redirect("/admin/teams?error=save");
  }

  revalidatePath("/admin/teams");
  redirect("/admin/teams?created=1");
}

export async function updateTeam(teamSeasonId: string, formData: FormData) {
  ensureDatabaseReady();

  const coachName = String(formData.get("coachName") ?? "").trim();
  const captainName = String(formData.get("captainName") ?? "").trim();
  const community = String(formData.get("community") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();

  const prisma = getPrismaClient();

  try {
    await prisma.teamSeason.update({
      where: { id: teamSeasonId },
      data: {
        coachName: coachName || "TBC",
        captainName: captainName || "TBC",
        team: {
          update: {
            community: community || undefined,
            logoUrl: logoUrl || undefined,
          },
        },
      },
    });
  } catch (error) {
    console.error("Unable to update team", error);
    redirect("/admin/teams?error=save");
  }

  revalidatePath("/admin/teams");
  redirect("/admin/teams?updated=1");
}

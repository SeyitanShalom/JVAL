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
      .replace(/(^-|-$)/g, "") || "player"
  );
}

async function getUniquePlayerSlug(fullName: string, currentPlayerId?: string) {
  const prisma = getPrismaClient();
  const baseSlug = slugify(fullName);
  let slug = baseSlug;
  let suffix = 2;

  while (
    await prisma.player.findFirst({
      where: { slug, ...(currentPlayerId ? { id: { not: currentPlayerId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  return slug;
}

async function ensureDatabaseReady() {
  await requireAdminPermission("manageTeams");

  if (!hasDatabaseConfig()) {
    redirect("/admin/players?error=database");
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

export async function createPlayer(formData: FormData) {
  await ensureDatabaseReady();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const squadNumber = parseInt(String(formData.get("squadNumber") ?? "0"), 10);
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();
  const positionCategory = String(formData.get("positionCategory") ?? "").trim();
  const detailedPosition = String(formData.get("detailedPosition") ?? "").trim().toUpperCase();
  const teamSeasonId = String(formData.get("teamSeasonId") ?? "").trim();

  if (!fullName || !squadNumber || !dateOfBirth || !positionCategory || !detailedPosition || !teamSeasonId) {
    redirect("/admin/players?error=missing");
  }

  const prisma = getPrismaClient();

  try {
    const teamSeason = await prisma.teamSeason.findUnique({
      where: { id: teamSeasonId },
      select: { seasonId: true },
    });

    if (!teamSeason) {
      redirect("/admin/players?error=no-team");
    }

    const slug = await getUniquePlayerSlug(fullName);
    const photoUrl = String(formData.get("photoUrl") ?? "").trim() || "/Profile.png";

    const player = await prisma.player.create({
      data: {
        slug,
        fullName,
        photoUrl,
        dateOfBirth: new Date(dateOfBirth),
      },
    });

    await prisma.squadPlayer.create({
      data: {
        seasonId: teamSeason.seasonId,
        teamSeasonId,
        playerId: player.id,
        squadNumber,
        positionCategory: positionCategory as
          | "GOALKEEPER"
          | "DEFENDER"
          | "MIDFIELDER"
          | "FORWARD",
        detailedPosition,
      },
    });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error("Unable to create player", error);
    redirect("/admin/players?error=save");
  }

  revalidatePath("/admin/players");
  redirect("/admin/players?created=1");
}

export async function updatePlayer(squadPlayerId: string, formData: FormData) {
  await ensureDatabaseReady();

  const squadNumber = parseInt(String(formData.get("squadNumber") ?? "0"), 10);
  const detailedPosition = String(formData.get("detailedPosition") ?? "").trim().toUpperCase();
  const positionCategory = String(formData.get("positionCategory") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();

  if (!squadNumber || !detailedPosition || !positionCategory) {
    redirect("/admin/players?error=missing");
  }

  const prisma = getPrismaClient();

  try {
    await prisma.squadPlayer.update({
      where: { id: squadPlayerId },
      data: {
        squadNumber,
        detailedPosition,
        positionCategory: positionCategory as
          | "GOALKEEPER"
          | "DEFENDER"
          | "MIDFIELDER"
          | "FORWARD",
        player: {
          update: {
            photoUrl: photoUrl || undefined,
          },
        },
      },
    });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    console.error("Unable to update player", error);
    redirect("/admin/players?error=save");
  }

  revalidatePath("/admin/players");
  redirect("/admin/players?updated=1");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

const BASE = "/admin/competitions";

// ─── Create Competition ───────────────────────────────────────────────────────

export async function createCompetition(formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const name = (formData.get("name") as string | null)?.trim();
  const type = (formData.get("type") as string | null) ?? "LGA";
  const plannedTeams = parseInt(formData.get("plannedTeams") as string, 10);
  const potCount = parseInt(formData.get("potCount") as string, 10) || 4;
  const qualifiers = parseInt(formData.get("qualifiers") as string, 10) || 8;
  const seasonId = (formData.get("seasonId") as string | null)?.trim();

  if (!name || !seasonId || isNaN(plannedTeams)) redirect(`${BASE}?error=missing`);

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    const prisma = getPrismaClient();
    await prisma.competition.create({
      data: {
        seasonId,
        slug,
        name,
        type: type as "LGA" | "STATE" | "SUPER_CUP" | "CUSTOM",
        description: name,
        plannedTeamCount: plannedTeams,
        potCount,
        qualifiersCount: qualifiers,
        knockoutStartRound: "QUARTER_FINAL",
      },
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?created=1`);
}

// ─── Update Competition ───────────────────────────────────────────────────────

export async function updateCompetition(competitionId: string, formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const name = (formData.get("name") as string | null)?.trim();
  const plannedTeams = parseInt(formData.get("plannedTeams") as string, 10);
  const potCount = parseInt(formData.get("potCount") as string, 10);
  const qualifiers = parseInt(formData.get("qualifiers") as string, 10);
  const status = (formData.get("status") as string | null) ?? "UPCOMING";

  if (!name) redirect(`${BASE}?error=missing`);

  try {
    const prisma = getPrismaClient();
    await prisma.competition.update({
      where: { id: competitionId },
      data: {
        name,
        status: status as "UPCOMING" | "ACTIVE" | "COMPLETED",
        plannedTeamCount: isNaN(plannedTeams) ? undefined : plannedTeams,
        potCount: isNaN(potCount) ? undefined : potCount,
        qualifiersCount: isNaN(qualifiers) ? undefined : qualifiers,
      },
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?updated=1`);
}

// ─── Delete Competition ───────────────────────────────────────────────────────

export async function deleteCompetition(competitionId: string) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  try {
    const prisma = getPrismaClient();
    await prisma.competition.delete({ where: { id: competitionId } });
  } catch {
    redirect(`${BASE}?error=delete`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?deleted=1`);
}

// ─── Create Season ────────────────────────────────────────────────────────────

export async function createSeason(formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const label = (formData.get("label") as string | null)?.trim();
  const status = (formData.get("status") as string | null) ?? "UPCOMING";

  if (!label) redirect(`${BASE}?error=missing`);

  const slug = label!.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  try {
    const prisma = getPrismaClient();
    await prisma.season.create({
      data: {
        label: label!,
        slug,
        status: status as "UPCOMING" | "ACTIVE" | "COMPLETED" | "ARCHIVED",
        isCurrent: status === "ACTIVE",
      },
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?created=1`);
}

// ─── Update Season ────────────────────────────────────────────────────────────

export async function updateSeason(seasonId: string, formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const label = (formData.get("label") as string | null)?.trim();
  const status = (formData.get("status") as string | null) ?? "UPCOMING";

  if (!label) redirect(`${BASE}?error=missing`);

  try {
    const prisma = getPrismaClient();
    await prisma.season.update({
      where: { id: seasonId },
      data: {
        label: label!,
        status: status as "UPCOMING" | "ACTIVE" | "COMPLETED" | "ARCHIVED",
        isCurrent: status === "ACTIVE",
      },
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?updated=1`);
}

// ─── Delete Season ────────────────────────────────────────────────────────────

export async function deleteSeason(seasonId: string) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  try {
    const prisma = getPrismaClient();
    await prisma.season.delete({ where: { id: seasonId } });
  } catch {
    redirect(`${BASE}?error=delete`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?deleted=1`);
}

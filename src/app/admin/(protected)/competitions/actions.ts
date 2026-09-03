"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

const BASE = "/admin/competitions";

function parsePositiveInt(value: FormDataEntryValue | null, fallback?: number) {
  const parsed = parseInt(String(value ?? ""), 10);

  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
}

// ─── Create Competition ───────────────────────────────────────────────────────

export async function createCompetition(formData: FormData) {
  await requireAdminPermission("manageTournamentStructure");
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const name = (formData.get("name") as string | null)?.trim();
  const type = (formData.get("type") as string | null) ?? "LGA";
  const plannedTeams = parseInt(formData.get("plannedTeams") as string, 10);
  const potCount = parsePositiveInt(formData.get("potCount"), 4) ?? 4;
  const opponentsPerPot = parsePositiveInt(formData.get("opponentsPerPot"), 1) ?? 1;
  const includeOwnPotOpponents = formData.get("includeOwnPotOpponents") === "on";
  const qualifiers = parsePositiveInt(formData.get("qualifiers"), 8) ?? 8;
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
        opponentsPerPot,
        includeOwnPotOpponents,
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
  await requireAdminPermission("manageTournamentStructure");
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const name = (formData.get("name") as string | null)?.trim();
  const plannedTeams = parseInt(formData.get("plannedTeams") as string, 10);
  const potCount = parsePositiveInt(formData.get("potCount"));
  const opponentsPerPot = parsePositiveInt(formData.get("opponentsPerPot"));
  const includeOwnPotOpponents = formData.get("includeOwnPotOpponents") === "on";
  const qualifiers = parsePositiveInt(formData.get("qualifiers"));
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
        potCount,
        opponentsPerPot,
        includeOwnPotOpponents,
        qualifiersCount: qualifiers,
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
  await requireAdminPermission("deleteCriticalData");
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
  await requireAdminPermission("manageTournamentStructure");
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
  await requireAdminPermission("manageTournamentStructure");
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
  await requireAdminPermission("deleteCriticalData");
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

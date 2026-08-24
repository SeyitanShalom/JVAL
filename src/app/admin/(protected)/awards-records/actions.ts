"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

const BASE = "/admin/awards-records";

// ─── Create Award ─────────────────────────────────────────────────────────────

export async function createAward(formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const title = (formData.get("title") as string | null)?.trim();
  const winnerText = (formData.get("winnerText") as string | null)?.trim();
  const detail = (formData.get("detail") as string | null)?.trim() ?? "";
  const type = (formData.get("type") as string | null) ?? "AWARD";
  const seasonId = (formData.get("seasonId") as string | null)?.trim();
  const competitionId = (formData.get("competitionId") as string | null)?.trim() || null;

  if (!title || !winnerText || !seasonId) redirect(`${BASE}?error=missing`);

  try {
    const prisma = getPrismaClient();
    await prisma.awardRecord.create({
      data: {
        seasonId: seasonId!,
        competitionId: competitionId,
        type: type as "AWARD" | "RECORD",
        title: title!,
        winnerText: winnerText!,
        detail,
      },
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?created=1`);
}

// ─── Update Award ─────────────────────────────────────────────────────────────

export async function updateAward(awardId: string, formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const title = (formData.get("title") as string | null)?.trim();
  const winnerText = (formData.get("winnerText") as string | null)?.trim();
  const detail = (formData.get("detail") as string | null)?.trim();
  const type = (formData.get("type") as string | null);
  const competitionId = (formData.get("competitionId") as string | null)?.trim() || null;

  if (!title || !winnerText) redirect(`${BASE}?error=missing`);

  try {
    const prisma = getPrismaClient();
    await prisma.awardRecord.update({
      where: { id: awardId },
      data: {
        title: title!,
        winnerText: winnerText!,
        detail: detail ?? undefined,
        type: type ? (type as "AWARD" | "RECORD") : undefined,
        competitionId,
      },
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?updated=1`);
}

// ─── Delete Award ─────────────────────────────────────────────────────────────

export async function deleteAward(awardId: string) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  try {
    const prisma = getPrismaClient();
    await prisma.awardRecord.delete({ where: { id: awardId } });
  } catch {
    redirect(`${BASE}?error=delete`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?deleted=1`);
}

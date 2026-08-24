"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

const BASE = "/admin/galleries";

// ─── Create Gallery Image ─────────────────────────────────────────────────────

export async function createGalleryImage(formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const title = (formData.get("title") as string | null)?.trim();
  const imageUrl =
    (formData.get("imageUrl") as string | null)?.trim() ||
    (formData.get("url") as string | null)?.trim() ||
    "/images/gallery-placeholder.jpg";
  const scope = (formData.get("scope") as string | null) ?? "GENERAL";
  const seasonId = (formData.get("seasonId") as string | null)?.trim() || null;
  const competitionId = (formData.get("competitionId") as string | null)?.trim() || null;
  const altText = (formData.get("altText") as string | null)?.trim() || null;

  if (!title) redirect(`${BASE}?error=missing`);

  try {
    const prisma = getPrismaClient();
    await prisma.galleryImage.create({
      data: {
        title: title!,
        imageUrl,
        altText,
        scope: scope as
          | "SEASON"
          | "COMPETITION"
          | "MATCH"
          | "TEAM"
          | "PLAYER"
          | "VENUE"
          | "GENERAL",
        seasonId: seasonId || undefined,
        competitionId: competitionId || undefined,
      },
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?created=1`);
}

// ─── Update Gallery Image ─────────────────────────────────────────────────────

export async function updateGalleryImage(imageId: string, formData: FormData) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const title = (formData.get("title") as string | null)?.trim();
  const imageUrl =
    (formData.get("imageUrl") as string | null)?.trim() ||
    (formData.get("url") as string | null)?.trim();
  const scope = (formData.get("scope") as string | null);
  const competitionId = (formData.get("competitionId") as string | null)?.trim() || null;
  const altText = (formData.get("altText") as string | null)?.trim() || null;

  if (!title) redirect(`${BASE}?error=missing`);

  try {
    const prisma = getPrismaClient();
    await prisma.galleryImage.update({
      where: { id: imageId },
      data: {
        title: title!,
        imageUrl: imageUrl || undefined,
        scope: scope
          ? (scope as "SEASON" | "COMPETITION" | "MATCH" | "TEAM" | "PLAYER" | "VENUE" | "GENERAL")
          : undefined,
        competitionId,
        altText,
      },
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?updated=1`);
}

// ─── Delete Gallery Image ─────────────────────────────────────────────────────

export async function deleteGalleryImage(imageId: string) {
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  try {
    const prisma = getPrismaClient();
    await prisma.galleryImage.delete({ where: { id: imageId } });
  } catch {
    redirect(`${BASE}?error=delete`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?deleted=1`);
}

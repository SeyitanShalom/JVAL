"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

const BASE = "/admin/news";

// ─── Create News Post ─────────────────────────────────────────────────────────

export async function createNewsPost(formData: FormData) {
  await requireAdminPermission("manageContent");
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const title = (formData.get("title") as string | null)?.trim();
  const content = (formData.get("content") as string | null)?.trim() ?? "";
  const publishDate = (formData.get("publishDate") as string | null)?.trim();
  const competitionId = (formData.get("competitionId") as string | null)?.trim();
  const seasonId = (formData.get("seasonId") as string | null)?.trim();
  const coverImageUrl = (formData.get("coverImageUrl") as string | null)?.trim();

  if (!title || !competitionId || !seasonId || !coverImageUrl) {
    redirect(`${BASE}?error=missing`);
  }

  const slug =
    title!.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString(36);

  const excerpt = content.slice(0, 160);

  try {
    const prisma = getPrismaClient();
    await prisma.newsPost.create({
      data: {
        seasonId: seasonId!,
        competitionId: competitionId!,
        slug,
        title: title!,
        content,
        excerpt,
        coverImageUrl: coverImageUrl!,
        publishDate: publishDate ? new Date(publishDate) : new Date(),
      },
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?created=1`);
}

// ─── Update News Post ─────────────────────────────────────────────────────────

export async function updateNewsPost(postId: string, formData: FormData) {
  await requireAdminPermission("manageContent");
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const title = (formData.get("title") as string | null)?.trim();
  const content = (formData.get("content") as string | null)?.trim();
  const publishDate = (formData.get("publishDate") as string | null)?.trim();
  const competitionId = (formData.get("competitionId") as string | null)?.trim();
  const coverImageUrl = (formData.get("coverImageUrl") as string | null)?.trim();

  if (!title) redirect(`${BASE}?error=missing`);

  try {
    const prisma = getPrismaClient();
    await prisma.newsPost.update({
      where: { id: postId },
      data: {
        title: title!,
        content: content ?? undefined,
        excerpt: content ? content.slice(0, 160) : undefined,
        coverImageUrl: coverImageUrl || undefined,
        publishDate: publishDate ? new Date(publishDate) : undefined,
        competitionId: competitionId ?? undefined,
      },
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?updated=1`);
}

// ─── Delete News Post ─────────────────────────────────────────────────────────

export async function deleteNewsPost(postId: string) {
  await requireAdminPermission("manageContent");
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  try {
    const prisma = getPrismaClient();
    await prisma.newsPost.delete({ where: { id: postId } });
  } catch {
    redirect(`${BASE}?error=delete`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?deleted=1`);
}

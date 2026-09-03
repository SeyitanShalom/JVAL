"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

function getVenueInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!name || !location) {
    return null;
  }

  return { name, location };
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "venue";
}

async function getUniqueVenueSlug(name: string, currentVenueId?: string) {
  const prisma = getPrismaClient();
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (
    await prisma.venue.findFirst({
      where: {
        slug,
        ...(currentVenueId ? { id: { not: currentVenueId } } : {}),
      },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

async function ensureDatabaseReady(permission: "manageContent" | "deleteCriticalData") {
  await requireAdminPermission(permission);

  if (!hasDatabaseConfig()) {
    redirect("/admin/venues?error=database");
  }
}

export async function createVenue(formData: FormData) {
  await ensureDatabaseReady("manageContent");

  const input = getVenueInput(formData);

  if (!input) {
    redirect("/admin/venues?error=missing");
  }

  const prisma = getPrismaClient();

  try {
    await prisma.venue.create({
      data: {
        ...input,
        slug: await getUniqueVenueSlug(input.name),
      },
    });
  } catch (error) {
    console.error("Unable to create venue", error);
    redirect("/admin/venues?error=save");
  }

  revalidatePath("/admin/venues");
  redirect("/admin/venues?created=1");
}

export async function updateVenue(venueId: string, formData: FormData) {
  await ensureDatabaseReady("manageContent");

  const input = getVenueInput(formData);

  if (!input) {
    redirect("/admin/venues?error=missing");
  }

  const prisma = getPrismaClient();

  try {
    await prisma.venue.update({
      where: { id: venueId },
      data: {
        ...input,
        slug: await getUniqueVenueSlug(input.name, venueId),
      },
    });
  } catch (error) {
    console.error("Unable to update venue", error);
    redirect("/admin/venues?error=save");
  }

  revalidatePath("/admin/venues");
  redirect("/admin/venues?updated=1");
}

export async function deleteVenue(venueId: string) {
  await ensureDatabaseReady("deleteCriticalData");

  const prisma = getPrismaClient();

  try {
    await prisma.venue.delete({
      where: { id: venueId },
    });
  } catch (error) {
    console.error("Unable to delete venue", error);
    redirect("/admin/venues?error=delete");
  }

  revalidatePath("/admin/venues");
  redirect("/admin/venues?deleted=1");
}

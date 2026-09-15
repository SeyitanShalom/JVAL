"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-auth";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import { contactFieldConfigs, siteSettingsKey } from "@/lib/admin-settings";

const BASE = "/admin/settings";

export async function saveAboutContentAction(formData: FormData) {
  await requireAdminPermission("manageSettings");
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  const officialName = getTextValue(formData, "officialName");
  const sponsorWording = getTextValue(formData, "sponsorWording");
  const aboutCopy = getTextValue(formData, "aboutCopy");

  if (!officialName || !sponsorWording || !aboutCopy) {
    redirect(`${BASE}?error=missing`);
  }

  try {
    const prisma = getPrismaClient();
    const existingBlock = await prisma.siteContentBlock.findFirst({
      where: { key: siteSettingsKey, seasonId: null },
      select: { id: true },
    });

    const content = {
      officialName,
      sponsorWording,
      aboutCopy,
    };

    if (existingBlock) {
      await prisma.siteContentBlock.update({
        where: { id: existingBlock.id },
        data: {
          title: "Site settings",
          content,
          isPublished: true,
        },
      });
    } else {
      await prisma.siteContentBlock.create({
        data: {
          key: siteSettingsKey,
          title: "Site settings",
          content,
          isPublished: true,
        },
      });
    }
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?saved=about`);
}

export async function saveContactLinksAction(formData: FormData) {
  await requireAdminPermission("manageSettings");
  if (!hasDatabaseConfig()) redirect(`${BASE}?error=database`);

  try {
    const prisma = getPrismaClient();

    await prisma.$transaction(async (tx) => {
      for (const [sortOrder, config] of contactFieldConfigs.entries()) {
        const value = getTextValue(formData, `${config.field}Value`);
        const url = getTextValue(formData, `${config.field}Url`);

        await tx.contactMethod.deleteMany({
          where: { type: config.type },
        });

        if (!value && !url) continue;

        await tx.contactMethod.create({
          data: {
            type: config.type,
            label: config.label,
            value: value || url,
            url: url || null,
            sortOrder,
            isActive: Boolean(value || url),
          },
        });
      }
    });
  } catch {
    redirect(`${BASE}?error=save`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?saved=contacts`);
}

function getTextValue(formData: FormData, key: string) {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

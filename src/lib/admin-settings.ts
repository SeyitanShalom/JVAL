import "server-only";

import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";

export const siteSettingsKey = "site_settings";

export const defaultAboutContent = {
  officialName: "Johnvents Apex League",
  sponsorWording: "Powered by Johnvents Foods",
  aboutCopy:
    "Johnvents Apex League is a seasonal football tournament platform for fixtures, live match updates, tables, player statistics, awards, and records.",
};

export const contactFieldConfigs = [
  { field: "phone", type: "PHONE", label: "Phone number" },
  { field: "whatsapp", type: "WHATSAPP", label: "WhatsApp" },
  { field: "facebook", type: "FACEBOOK", label: "Facebook" },
  { field: "instagram", type: "INSTAGRAM", label: "Instagram" },
  { field: "email", type: "EMAIL", label: "Email" },
] as const;

export type ContactField = (typeof contactFieldConfigs)[number];

export type AdminSettingsData = {
  source: "database" | "unavailable";
  databaseReady: boolean;
  error?: string;
  about: typeof defaultAboutContent;
  contacts: Record<
    ContactField["field"],
    {
      label: string;
      value: string;
      url: string;
    }
  >;
};

export function getDefaultContacts(): AdminSettingsData["contacts"] {
  return contactFieldConfigs.reduce((contacts, config) => {
    contacts[config.field] = {
      label: config.label,
      value: "",
      url: "",
    };
    return contacts;
  }, {} as AdminSettingsData["contacts"]);
}

export async function getAdminSettingsData(): Promise<AdminSettingsData> {
  if (!hasDatabaseConfig()) {
    return {
      source: "unavailable",
      databaseReady: false,
      about: defaultAboutContent,
      contacts: getDefaultContacts(),
    };
  }

  try {
    const prisma = getPrismaClient();
    const [contentBlock, contactMethods] = await Promise.all([
      prisma.siteContentBlock.findFirst({
        where: { key: siteSettingsKey, seasonId: null },
        select: { content: true },
      }),
      prisma.contactMethod.findMany({
        orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      }),
    ]);

    const contacts = getDefaultContacts();

    for (const config of contactFieldConfigs) {
      const contact = contactMethods.find(
        (method) => method.type === config.type,
      );

      contacts[config.field] = {
        label: config.label,
        value: contact?.value ?? "",
        url: contact?.url ?? "",
      };
    }

    return {
      source: "database",
      databaseReady: true,
      about: normalizeAboutContent(contentBlock?.content),
      contacts,
    };
  } catch {
    return {
      source: "unavailable",
      databaseReady: false,
      error: "Settings data could not be loaded.",
      about: defaultAboutContent,
      contacts: getDefaultContacts(),
    };
  }
}

function normalizeAboutContent(content: unknown) {
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    return defaultAboutContent;
  }

  const record = content as Record<string, unknown>;

  return {
    officialName:
      typeof record.officialName === "string"
        ? record.officialName
        : defaultAboutContent.officialName,
    sponsorWording:
      typeof record.sponsorWording === "string"
        ? record.sponsorWording
        : defaultAboutContent.sponsorWording,
    aboutCopy:
      typeof record.aboutCopy === "string"
        ? record.aboutCopy
        : defaultAboutContent.aboutCopy,
  };
}

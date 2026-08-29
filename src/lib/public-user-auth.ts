import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getPrismaClient, hasDatabaseConfig } from "@/lib/db";
import {
  getSupabaseServerClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-client";

export type PublicAuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export async function getPublicAuthUser(request: NextRequest) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  if (!isSupabaseAuthConfigured()) {
    return null;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return mapSupabaseUser(data.user);
}

export async function upsertPublicUserProfile(user: PublicAuthUser) {
  if (!hasDatabaseConfig()) {
    throw new Error("DATABASE_URL is required for public profiles.");
  }

  const prisma = getPrismaClient() as any;
  const existingProfile = await prisma.publicUserProfile.findUnique({
    where: { id: user.id },
  });

  if (existingProfile) {
    return prisma.publicUserProfile.update({
      where: { id: user.id },
      data: {
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  }

  const fallbackName =
    cleanPublicDisplayName(user.displayName) ??
    cleanPublicDisplayName(getNameFromEmail(user.email)) ??
    "Apex fan";
  const { displayName, displayNameKey } = await getAvailableDisplayName(
    prisma,
    fallbackName,
    user.id,
  );

  return prisma.publicUserProfile.create({
    data: {
      id: user.id,
      email: user.email,
      displayName,
      displayNameKey,
      avatarUrl: user.avatarUrl,
    },
  });
}

export function cleanPublicDisplayName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.replace(/\s+/g, " ").trim().slice(0, 60).trim();

  return trimmed || null;
}

export function getPublicDisplayNameKey(displayName: string | null) {
  return displayName?.toLowerCase() ?? null;
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  return match?.[1] ?? null;
}

function mapSupabaseUser(user: User): PublicAuthUser {
  const metadata = user.user_metadata ?? {};
  const displayName =
    readMetadataString(metadata, "full_name") ??
    readMetadataString(metadata, "name") ??
    readMetadataString(metadata, "display_name") ??
    getNameFromEmail(user.email ?? null);

  return {
    id: user.id,
    email: user.email ?? null,
    displayName,
    avatarUrl:
      readMetadataString(metadata, "avatar_url") ??
      readMetadataString(metadata, "picture"),
  };
}

function readMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getNameFromEmail(email: string | null) {
  return email?.split("@")[0]?.replace(/[._-]/g, " ") ?? null;
}

async function getAvailableDisplayName(
  prisma: any,
  preferredName: string,
  userId: string,
) {
  const displayName = cleanPublicDisplayName(preferredName) ?? "Apex fan";
  const displayNameKey = getPublicDisplayNameKey(displayName);
  const existingProfile = await prisma.publicUserProfile.findFirst({
    where: {
      displayNameKey,
      NOT: { id: userId },
    },
    select: { id: true },
  });

  if (!existingProfile) {
    return { displayName, displayNameKey };
  }

  const suffix = userId.replace(/[^a-z0-9]/gi, "").slice(0, 10).toLowerCase();
  const fallbackName = appendDisplayNameSuffix(displayName, suffix);

  return {
    displayName: fallbackName,
    displayNameKey: getPublicDisplayNameKey(fallbackName),
  };
}

function appendDisplayNameSuffix(displayName: string, suffix: string) {
  const suffixWithSpace = ` ${suffix}`;
  const nameLength = Math.max(1, 60 - suffixWithSpace.length);

  return `${displayName.slice(0, nameLength).trim()}${suffixWithSpace}`;
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-auth";
import { recalculateAllLeagueTablesAndStats } from "@/lib/standings-engine";
import { hasDatabaseConfig } from "@/lib/db";

const BASE = "/admin/statistics";

export async function recalculateStatsAction(competitionId?: string) {
  await requireAdminPermission("manageStatistics");

  if (!hasDatabaseConfig()) {
    redirect(`${BASE}?error=database`);
  }

  try {
    await recalculateAllLeagueTablesAndStats(competitionId);
  } catch (e) {
    console.error("Failed to recalculate statistics:", e);
    redirect(`${BASE}?error=recalc_failed`);
  }

  revalidatePath(BASE);
  revalidatePath("/admin/fixtures");
  revalidatePath("/admin/competitions");
  revalidatePath("/tables");
  revalidatePath("/statistics");
  revalidatePath("/");
  redirect(`${BASE}?recalculated=1`);
}

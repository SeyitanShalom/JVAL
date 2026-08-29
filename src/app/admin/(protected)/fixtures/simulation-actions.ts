"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasDatabaseConfig } from "@/lib/db";
import {
  simulateSingleMatch,
  simulateBatchMatches,
  simulateFullTournament,
  resetCompetitionMatches,
} from "@/lib/simulation-engine";

const BASE = "/admin/fixtures";

export async function simulateMatchAction(matchId: string) {
  if (!hasDatabaseConfig()) {
    redirect(`${BASE}?error=database`);
  }

  try {
    const res = await simulateSingleMatch(matchId);
    if (!res) {
      redirect(`${BASE}?error=sim_failed`);
    }
  } catch (e) {
    console.error("Simulation error:", e);
    redirect(`${BASE}?error=sim_failed`);
  }

  revalidatePath(BASE);
  revalidatePath("/admin/statistics");
  revalidatePath("/tables");
  revalidatePath("/statistics");
  revalidatePath("/fixtures");
  revalidatePath("/fixtures-results");
  revalidatePath("/");
  redirect(`${BASE}?simulated=1`);
}

export async function simulateMatchdayAction(formData: FormData) {
  if (!hasDatabaseConfig()) {
    redirect(`${BASE}?error=database`);
  }

  const competitionId = (formData.get("competitionId") as string | null)?.trim();
  const matchday = (formData.get("matchday") as string | null)?.trim() || "all";

  if (!competitionId) {
    redirect(`${BASE}?error=missing`);
  }

  try {
    const res = await simulateBatchMatches(competitionId, matchday);
    if (res.count === 0) {
      redirect(`${BASE}?error=no_upcoming_matches`);
    }
  } catch (e) {
    console.error("Batch simulation error:", e);
    redirect(`${BASE}?error=sim_failed`);
  }

  revalidatePath(BASE);
  revalidatePath("/admin/statistics");
  revalidatePath("/tables");
  revalidatePath("/statistics");
  revalidatePath("/fixtures");
  revalidatePath("/fixtures-results");
  revalidatePath("/");
  redirect(`${BASE}?batch_simulated=1`);
}

export async function simulateFullTournamentAction(competitionId: string) {
  if (!hasDatabaseConfig()) {
    redirect(`${BASE}?error=database`);
  }

  try {
    await simulateFullTournament(competitionId);
  } catch (e) {
    console.error("Full tournament simulation error:", e);
    redirect(`${BASE}?error=sim_failed`);
  }

  revalidatePath(BASE);
  revalidatePath("/admin/competitions");
  revalidatePath("/admin/statistics");
  revalidatePath("/admin/awards-records");
  revalidatePath("/tables");
  revalidatePath("/statistics");
  revalidatePath("/fixtures");
  revalidatePath("/fixtures-results");
  revalidatePath("/competitions");
  revalidatePath("/");
  redirect(`${BASE}?tournament_simulated=1`);
}

export async function resetCompetitionSimulationAction(competitionId: string) {
  if (!hasDatabaseConfig()) {
    redirect(`${BASE}?error=database`);
  }

  try {
    await resetCompetitionMatches(competitionId);
  } catch (e) {
    console.error("Reset simulation error:", e);
    redirect(`${BASE}?error=reset_failed`);
  }

  revalidatePath(BASE);
  revalidatePath("/admin/statistics");
  revalidatePath("/tables");
  revalidatePath("/statistics");
  revalidatePath("/fixtures");
  revalidatePath("/fixtures-results");
  revalidatePath("/");
  redirect(`${BASE}?sim_reset=1`);
}

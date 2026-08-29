"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export type LiveFixtureSummary = {
  id: string;
  slug: string;
  status: string;
  minute?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  currentPeriod?: string | null;
  firstHalfStartedAt?: string | null;
  secondHalfStartedAt?: string | null;
};

export type LiveFixturesStatusData = {
  liveCount: number;
  liveMatches: LiveFixtureSummary[];
  fixtureVersion?: string;
  updatedAt: string;
};

export function useLiveFixturesRealtime(initialData?: LiveFixturesStatusData | null) {
  const [data, setData] = useState<LiveFixturesStatusData>(
    initialData ?? { liveCount: 0, liveMatches: [], updatedAt: new Date().toISOString() }
  );

  const fetchLiveStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/fixtures/live-status?_t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      if (json && Array.isArray(json.liveMatches)) {
        setData(json);
      }
    } catch {
      // Ignore background network error
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel("public-live-matches")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Match",
        },
        () => {
          fetchLiveStatus();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "MatchEvent",
        },
        () => {
          fetchLiveStatus();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "PenaltyAttempt",
        },
        () => {
          fetchLiveStatus();
        }
      )
      .subscribe();

    // Background polling fallback
    const interval = setInterval(fetchLiveStatus, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchLiveStatus]);

  return {
    liveCount: data.liveCount,
    liveMatches: data.liveMatches,
    fixtureVersion: data.fixtureVersion,
    updatedAt: data.updatedAt,
    refetch: fetchLiveStatus,
  };
}

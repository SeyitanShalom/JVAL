"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

type LiveFixturesSyncProps = {
  hasLiveMatches: boolean;
};

export default function LiveFixturesSync({ hasLiveMatches }: LiveFixturesSyncProps) {
  const router = useRouter();
  const prevCountRef = useRef<number | null>(null);

  const syncFixtures = useCallback(async () => {
    try {
      const res = await fetch(`/api/fixtures/live-status?_t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;

      const data = await res.json();
      const liveCount = data.liveCount ?? 0;

      if (prevCountRef.current !== null && prevCountRef.current !== liveCount) {
        router.refresh();
      } else if (hasLiveMatches) {
        router.refresh();
      }
      prevCountRef.current = liveCount;
    } catch {
      // silent
    }
  }, [hasLiveMatches, router]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel("public-fixtures-list-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Match",
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    // Background poller fallback
    const intervalTime = hasLiveMatches ? 5000 : 15000;
    const interval = setInterval(syncFixtures, intervalTime);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [hasLiveMatches, router, syncFixtures]);

  return null;
}
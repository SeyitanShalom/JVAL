"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type LiveFixturesSyncProps = {
  hasLiveMatches: boolean;
};

export default function LiveFixturesSync({ hasLiveMatches }: LiveFixturesSyncProps) {
  const router = useRouter();
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    // Poll every 5s if live matches exist, or every 15s if upcoming fixtures might start
    const intervalTime = hasLiveMatches ? 5000 : 15000;

    const poll = async () => {
      try {
        const res = await fetch(`/api/fixtures/live-status?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data = await res.json();
        const liveCount = data.liveCount ?? 0;

        if (prevCountRef.current !== null && prevCountRef.current !== liveCount) {
          router.refresh();
        } else if (hasLiveMatches) {
          // If already live, refresh periodically for scores
          router.refresh();
        }
        prevCountRef.current = liveCount;
      } catch {
        // silent
      }
    };

    const interval = setInterval(poll, intervalTime);
    return () => clearInterval(interval);
  }, [hasLiveMatches, router]);

  return null;
}
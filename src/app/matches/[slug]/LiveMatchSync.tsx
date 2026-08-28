"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiRefreshCw, FiZap, FiCheckCircle } from "react-icons/fi";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

type LiveMatchSyncProps = {
  slug: string;
  status: string;
  initialScore: string;
  initialEventCount: number;
};

export default function LiveMatchSync({
  slug,
  status,
  initialScore,
  initialEventCount,
}: LiveMatchSyncProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const isLive =
    status.toLowerCase() === "live" ||
    status.toLowerCase() === "halftime" ||
    status.toLowerCase() === "penalties";

  const prevScoreRef = useRef(initialScore);
  const prevEventsRef = useRef(initialEventCount);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    prevScoreRef.current = initialScore;
    prevEventsRef.current = initialEventCount;
    prevStatusRef.current = status;
  }, [initialScore, initialEventCount, status]);

  const triggerRevalidation = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch(`/api/matches/${slug}/live?_t=${Date.now()}`, {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();
      const scoreStr = `${data.homeScore ?? "-"}:${data.awayScore ?? "-"}`;
      const eventCount = data.eventCount ?? 0;
      const currentStatus = data.status;

      setLastSyncTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );

      if (
        scoreStr !== prevScoreRef.current ||
        eventCount !== prevEventsRef.current ||
        currentStatus !== prevStatusRef.current
      ) {
        prevScoreRef.current = scoreStr;
        prevEventsRef.current = eventCount;
        prevStatusRef.current = currentStatus;
        router.refresh();
      }
    } catch {
      // silent fail on network blip
    } finally {
      setIsSyncing(false);
    }
  }, [slug, router]);

  // Realtime subscription via Supabase Realtime
  useEffect(() => {
    if (!isLive) return;

    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`public-match-sync-${slug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Match",
        },
        () => {
          triggerRevalidation();
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
          triggerRevalidation();
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
          triggerRevalidation();
        }
      )
      .subscribe();

    // Secondary fallback poller every 4 seconds
    const interval = setInterval(triggerRevalidation, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isLive, slug, triggerRevalidation]);

  if (!isLive) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="flex items-center gap-1">
        <FiZap className="h-3 w-3 text-emerald-400" />
        Live Realtime Sync
      </span>
      {lastSyncTime && (
        <span className="text-[10px] font-semibold text-emerald-400/70">
          Â· {lastSyncTime}
        </span>
      )}
      {isSyncing ? (
        <FiRefreshCw className="h-2.5 w-2.5 animate-spin text-emerald-400/80" />
      ) : (
        <FiCheckCircle className="h-2.5 w-2.5 text-emerald-400/80" />
      )}
    </div>
  );
}
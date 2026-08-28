"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { calculateMatchTimerState, MatchTimerState } from "@/lib/match-timer-utils";

export type RealtimeMatchEvent = {
  id: string;
  minute: string;
  type: string;
  teamId: string;
  playerId: string;
  playerName?: string;
  playerNumber?: number | null;
  assistPlayerName?: string | null;
  playerInName?: string | null;
  playerOutName?: string | null;
  note?: string | null;
  isOverturned?: boolean;
};

export type RealtimePenaltyAttempt = {
  id: string;
  order: number;
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
  playerNumber?: number | null;
  scored: boolean;
};

export type RealtimeMatchData = {
  id: string;
  slug: string;
  status: string;
  minuteLabel?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  firstHalfStartedAt?: string | null;
  secondHalfStartedAt?: string | null;
  events: RealtimeMatchEvent[];
  penalties?: {
    home: number;
    away: number;
    attempts: RealtimePenaltyAttempt[];
  } | null;
};

export function useLiveMatchRealtime(slug: string, initialMatch?: RealtimeMatchData | null) {
  const [matchData, setMatchData] = useState<RealtimeMatchData | null>(initialMatch ?? null);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "reconnecting" | "offline">("connecting");
  const seenEventIds = useRef<Set<string>>(new Set((initialMatch?.events || []).map((e) => e.id)));
  const seenPenaltyIds = useRef<Set<string>>(new Set((initialMatch?.penalties?.attempts || []).map((p) => p.id)));

  // Authoritative dynamic timer calculation
  const [timerState, setTimerState] = useState<MatchTimerState>(() =>
    calculateMatchTimerState({
      status: matchData?.status || "UPCOMING",
      minuteLabel: matchData?.minuteLabel,
      firstHalfStartedAt: matchData?.firstHalfStartedAt,
      secondHalfStartedAt: matchData?.secondHalfStartedAt,
    })
  );

  // Sync state if initialMatch changes
  useEffect(() => {
    if (initialMatch) {
      setMatchData(initialMatch);
      (initialMatch.events || []).forEach((e) => seenEventIds.current.add(e.id));
      (initialMatch.penalties?.attempts || []).forEach((p) => seenPenaltyIds.current.add(p.id));
    }
  }, [initialMatch]);

  // Reconcile with server API
  const refetchLatest = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${slug}/live?_t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const fresh = await res.json();
      if (fresh && fresh.id) {
        setMatchData((prev) => {
          if (!prev) return fresh;
          return {
            ...prev,
            ...fresh,
            events: fresh.events || prev.events,
            penalties: fresh.penalties || prev.penalties,
          };
        });
        (fresh.events || []).forEach((e: RealtimeMatchEvent) => seenEventIds.current.add(e.id));
        (fresh.penalties?.attempts || []).forEach((p: RealtimePenaltyAttempt) => seenPenaltyIds.current.add(p.id));
      }
    } catch {
      // Ignore background network error
    }
  }, [slug]);

  // Continuous local timer calculation (second-by-second)
  useEffect(() => {
    const updateTimer = () => {
      if (!matchData) return;
      const next = calculateMatchTimerState({
        status: matchData.status,
        minuteLabel: matchData.minuteLabel,
        firstHalfStartedAt: matchData.firstHalfStartedAt,
        secondHalfStartedAt: matchData.secondHalfStartedAt,
      });
      setTimerState(next);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [matchData]);

  // Supabase Realtime Channel Subscription
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const matchId = matchData?.id;

    const channel = supabase
      .channel(`live-match-${slug}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Match",
        },
        (payload) => {
          const row = payload.new as any;
          if (row && (row.slug === slug || (matchId && row.id === matchId))) {
            setMatchData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                status: row.status,
                homeScore: row.homeScore,
                awayScore: row.awayScore,
                homePenaltyScore: row.homePenaltyScore,
                awayPenaltyScore: row.awayPenaltyScore,
                minuteLabel: row.minuteLabel,
                firstHalfStartedAt: row.firstHalfStartedAt,
                secondHalfStartedAt: row.secondHalfStartedAt,
              };
            });
            refetchLatest();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "MatchEvent",
        },
        (payload) => {
          const newEv = payload.new as any;
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as any)?.id;
            if (oldId) {
              setMatchData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  events: prev.events.filter((e) => e.id !== oldId),
                };
              });
              seenEventIds.current.delete(oldId);
            }
          } else if (newEv && (!matchId || newEv.matchId === matchId)) {
            refetchLatest();
          }
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
          refetchLatest();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("reconnecting");
          refetchLatest();
        } else if (status === "CLOSED") {
          setConnectionStatus("offline");
        }
      });

    // Fallback polling every 4 seconds to guarantee sync
    const pollInterval = setInterval(() => {
      refetchLatest();
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [slug, matchData?.id, refetchLatest]);

  return {
    matchData,
    timerState,
    connectionStatus,
    refetchLatest,
  };
}
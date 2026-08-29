"use client";

import { useEffect, useState } from "react";
import { calculateMatchTimerState } from "@/lib/match-timer-utils";

type LiveMatchClockProps = {
  status: string;
  minute?: string | null;
  currentPeriod?: string | null;
  firstHalfStartedAt?: string | Date | null;
  secondHalfStartedAt?: string | Date | null;
  variant?: "badge" | "hero" | "bracket" | "compact";
  className?: string;
};

export default function LiveMatchClock({
  status,
  minute,
  currentPeriod,
  firstHalfStartedAt,
  secondHalfStartedAt,
  variant = "badge",
  className = "",
}: LiveMatchClockProps) {
  const [now, setNow] = useState(() => new Date());
  const timerState = calculateMatchTimerState(
    {
      status,
      minuteLabel: minute,
      currentPeriod,
      firstHalfStartedAt,
      secondHalfStartedAt,
    },
    now,
  );

  useEffect(() => {
    if (timerState.isPaused || !timerState.isLive) return;

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isPaused, timerState.isLive]);

  const { isLive, clockTime, period } = timerState;
  const isHalfTime = period === "HALF_TIME";
  const isPens = period === "PENALTIES";
  const isFinished =
    period === "FULL_TIME" ||
    status.toLowerCase() === "fulltime" ||
    status.toLowerCase() === "finished";

  // Variant: Hero (Match details top header & Admin Console deck)
  if (variant === "hero") {
    if (isPens) {
      return (
        <span
          className={
            "flex items-center gap-2 rounded-full bg-purple-600 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-lg shadow-purple-600/30 " +
            className
          }
        >
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          <span>PEN</span>
        </span>
      );
    }
    if (isHalfTime) {
      return (
        <span
          className={
            "flex items-center gap-2 rounded-full bg-amber-500 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-lg shadow-amber-500/30 " +
            className
          }
        >
          <span className="inline-block h-2 w-2 rounded-full bg-white" />
          <span>HT</span>
        </span>
      );
    }
    if (isLive) {
      return (
        <span
          className={
            "flex items-center gap-2 rounded-full bg-red-600 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-lg shadow-red-600/30 " +
            className
          }
        >
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          <span className="font-mono tabular-nums tracking-normal">
            LIVE {clockTime}
          </span>
        </span>
      );
    }
    if (isFinished) {
      return (
        <span
          className={
            "rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold uppercase text-emerald-300 " +
            className
          }
        >
          FT
        </span>
      );
    }
    return (
      <span
        className={
          "rounded-full bg-red-500/20 px-3.5 py-1 text-xs font-bold uppercase text-red-500 " +
          className
        }
      >
        KO
      </span>
    );
  }

  // Variant: Bracket (Knockout Bracket tree)
  if (variant === "bracket") {
    if (isPens) {
      return (
        <span
          className={
            "inline-flex items-center gap-1 rounded bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold text-white " +
            className
          }
        >
          <span>PEN</span>
        </span>
      );
    }
    if (isHalfTime) {
      return (
        <span
          className={
            "inline-flex items-center gap-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white " +
            className
          }
        >
          <span>HT</span>
        </span>
      );
    }
    if (isLive) {
      return (
        <span
          className={
            "inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white " +
            className
          }
        >
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          <span className="font-mono tabular-nums">{clockTime}</span>
        </span>
      );
    }
    if (isFinished) {
      return (
        <span
          className={
            "rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 " +
            className
          }
        >
          FT
        </span>
      );
    }
    return null;
  }

  // Variant: Compact (Dashboard summary rows)
  if (variant === "compact") {
    if (isPens) {
      return (
        <span className={"font-bold text-purple-600 " + className}>PEN</span>
      );
    }
    if (isHalfTime) {
      return (
        <span className={"font-bold text-amber-600 " + className}>HT</span>
      );
    }
    if (isLive) {
      return (
        <span
          className={
            "inline-flex items-center gap-1 font-bold text-red-600 " + className
          }
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
          <span className="font-mono tabular-nums">{clockTime}</span>
        </span>
      );
    }
    if (isFinished) {
      return (
        <span className={"font-bold text-slate-500 " + className}>FT</span>
      );
    }
    return <span className={"font-bold text-slate-400 " + className}>KO</span>;
  }

  // Variant: Badge (Match cards and Fixture lists)
  if (isPens) {
    return (
      <span
        className={
          "inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 " +
          className
        }
      >
        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
        <span>PEN</span>
      </span>
    );
  }

  if (isHalfTime) {
    return (
      <span
        className={
          "inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 " +
          className
        }
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <span>HT</span>
      </span>
    );
  }

  if (isLive) {
    return (
      <span
        className={
          "inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700 " +
          className
        }
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
        <span className="font-mono tabular-nums">{clockTime}</span>
      </span>
    );
  }

  if (isFinished) {
    return (
      <span
        className={
          "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 " +
          className
        }
      >
        FT
      </span>
    );
  }

  return (
    <span
      className={
        "inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 " +
        className
      }
    >
      KO
    </span>
  );
}

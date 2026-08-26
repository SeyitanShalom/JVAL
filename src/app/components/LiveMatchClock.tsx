"use client";

import { useEffect, useState } from "react";

type LiveMatchClockProps = {
  status: string;
  minute?: string | null;
  variant?: "badge" | "hero" | "bracket" | "compact";
  className?: string;
};

export default function LiveMatchClock({
  status,
  minute,
  variant = "badge",
  className = "",
}: LiveMatchClockProps) {
  const normStatus = (status || "").toLowerCase();
  const isLive = normStatus === "live" || normStatus === "halftime" || normStatus === "penalties";
  const isHalfTime = normStatus === "halftime" || minute === "HT" || minute === "Half-time";
  const isPens = normStatus === "penalties" || minute === "PEN" || normStatus === "pens";
  const isFinished = normStatus === "finished" || normStatus === "fulltime" || minute === "FT";

  // Parse initial minutes from string
  // 1st half starts from 1' (60s)
  // 2nd half starts from 45' (45 * 60s)
  const parseInitialSeconds = (minStr?: string | null): number => {
    if (!minStr || minStr === "1'" || minStr === "1" || minStr === "") {
      return 60; // 1:00
    }
    if (minStr === "45'" || minStr === "45" || minStr === "46'" || minStr === "46") {
      return 45 * 60; // 45:00
    }
    if (minStr.includes("+")) {
      const parts = minStr.replace(/[^0-9+]/g, "").split("+");
      const base = parseInt(parts[0] || "45", 10);
      const extra = parseInt(parts[1] || "0", 10);
      return (base + extra) * 60;
    }
    const num = parseInt(minStr.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) {
      return Math.max(1, num) * 60;
    }
    return 60;
  };

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() =>
    parseInitialSeconds(minute)
  );

  // Sync state whenever props change from admin / live poller
  useEffect(() => {
    setElapsedSeconds(parseInitialSeconds(minute));
  }, [minute, status]);

  // Tick second-by-second when live and not paused at HT or PENS
  useEffect(() => {
    if (!isLive || isHalfTime || isPens || isFinished) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, isHalfTime, isPens, isFinished]);

  // Format the dynamic time label
  const formatTime = () => {
    if (isPens) return "PENS";
    if (isHalfTime) return "HT";
    if (isFinished) return "FT";

    const totalMinutes = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;

    // Check if in 1st half stoppage (started <= 45 and exceeded 45)
    const initialMin = parseInt((minute || "").replace(/[^0-9]/g, ""), 10) || 1;
    const isFirstHalf = initialMin <= 45;

    if (isFirstHalf && totalMinutes >= 45) {
      const extra = totalMinutes - 45;
      if (variant === "hero") {
        return `45+${extra}:${secs.toString().padStart(2, "0")}`;
      }
      return extra > 0 ? `45+${extra}'` : "45'";
    }

    // 2nd half stoppage (exceeded 90)
    if (totalMinutes >= 90) {
      const extra = totalMinutes - 90;
      if (variant === "hero") {
        return `90+${extra}:${secs.toString().padStart(2, "0")}`;
      }
      return extra > 0 ? `90+${extra}'` : "90'";
    }

    if (variant === "hero") {
      return `${totalMinutes}:${secs.toString().padStart(2, "0")}`;
    }

    return `${Math.max(1, totalMinutes)}'`;
  };

  const timeDisplay = formatTime();

  // Variant: Hero (Match details top header & Admin Console deck)
  if (variant === "hero") {
    if (isPens) {
      return (
        <span
          className={"flex items-center gap-2 rounded-full bg-purple-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-600/30 " + className}
        >
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          <span>SHOOTOUT Â· PENS</span>
        </span>
      );
    }
    if (isHalfTime) {
      return (
        <span
          className={"flex items-center gap-2 rounded-full bg-amber-500 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-500/30 " + className}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-white" />
          <span>HALF-TIME Â· HT</span>
        </span>
      );
    }
    if (isLive) {
      return (
        <span
          className={"flex items-center gap-2 rounded-full bg-red-600 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/30 " + className}
        >
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          <span>LIVE Â· {timeDisplay}</span>
        </span>
      );
    }
    if (isFinished) {
      return (
        <span
          className={"rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold uppercase text-emerald-300 " + className}
        >
          Full Time Â· FT
        </span>
      );
    }
    return (
      <span
        className={"rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-bold uppercase text-blue-300 " + className}
      >
        Upcoming
      </span>
    );
  }

  // Variant: Bracket (Knockout Bracket tree)
  if (variant === "bracket") {
    if (isPens) {
      return (
        <span className={"inline-flex items-center gap-1 rounded bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold text-white " + className}>
          <span>PENS</span>
        </span>
      );
    }
    if (isHalfTime) {
      return (
        <span className={"inline-flex items-center gap-1 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white " + className}>
          <span>HT</span>
        </span>
      );
    }
    if (isLive) {
      return (
        <span
          className={"inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white " + className}
        >
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          <span>{timeDisplay}</span>
        </span>
      );
    }
    if (isFinished) {
      return (
        <span className={"rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500 " + className}>
          FT
        </span>
      );
    }
    return null;
  }

  // Variant: Compact (Dashboard summary rows)
  if (variant === "compact") {
    if (isPens) {
      return <span className={"font-bold text-purple-600 " + className}>PENS</span>;
    }
    if (isHalfTime) {
      return <span className={"font-bold text-amber-600 " + className}>HT</span>;
    }
    if (isLive) {
      return (
        <span className={"inline-flex items-center gap-1 font-bold text-red-600 " + className}>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
          <span>{timeDisplay}</span>
        </span>
      );
    }
    if (isFinished) {
      return <span className={"font-bold text-slate-500 " + className}>FT</span>;
    }
    return <span className={"font-bold text-slate-400 " + className}>UPCOMING</span>;
  }

  // Variant: Badge (Match cards and Fixture lists)
  if (isPens) {
    return (
      <span
        className={"inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 " + className}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
        <span>PENS</span>
      </span>
    );
  }

  if (isHalfTime) {
    return (
      <span
        className={"inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 " + className}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <span>HT</span>
      </span>
    );
  }

  if (isLive) {
    return (
      <span
        className={"inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700 " + className}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600" />
        <span>{timeDisplay}</span>
      </span>
    );
  }

  if (isFinished) {
    return (
      <span
        className={"inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 " + className}
      >
        FT
      </span>
    );
  }

  return (
    <span
      className={"inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 " + className}
    >
      Upcoming
    </span>
  );
}
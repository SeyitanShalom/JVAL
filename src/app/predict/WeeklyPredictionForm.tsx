"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLock,
  FiMapPin,
  FiSave,
  FiTarget,
} from "react-icons/fi";
import {
  getSupabaseBrowserClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-client";

export type WeeklyPredictionMatch = {
  id: string;
  slug: string;
  matchday: string;
  date: string;
  status: string;
  locked: boolean;
  competitionName: string;
  venueName: string;
  homeTeam: {
    name: string;
    shortName: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    shortName: string;
    logo: string;
  };
};

type SavedPrediction = {
  matchId: string;
  predictedHomeScore: number;
  predictedAwayScore: number;
  awardedPoints: number;
  exactScore: boolean;
};

type ScoreState = Record<
  string,
  {
    home: string;
    away: string;
    awardedPoints?: number;
    exactScore?: boolean;
    saved?: boolean;
  }
>;

type AuthState = "checking" | "guest" | "ready" | "unconfigured";

const SUPABASE_UNCONFIGURED_MESSAGE =
  "Supabase auth is not configured yet, so predictions cannot be saved.";

export default function WeeklyPredictionForm({
  weekKey,
  weekTitle,
  matches,
}: {
  weekKey: string;
  weekTitle: string;
  matches: WeeklyPredictionMatch[];
}) {
  const router = useRouter();
  const authConfigured = isSupabaseAuthConfigured();
  const [authState, setAuthState] = useState<AuthState>(() =>
    authConfigured ? "checking" : "unconfigured",
  );
  const [token, setToken] = useState<string | null>(null);
  const [scores, setScores] = useState<ScoreState>(() =>
    createEmptyScores(matches),
  );
  const [message, setMessage] = useState(() =>
    authConfigured ? "" : SUPABASE_UNCONFIGURED_MESSAGE,
  );
  const [saving, setSaving] = useState(false);

  const openMatches = useMemo(
    () => matches.filter((match) => !match.locked),
    [matches],
  );
  const completedCount = openMatches.filter((match) => {
    const score = scores[match.id];

    return score?.home !== "" && score?.away !== "";
  }).length;
  const allOpenMatchesCompleted =
    openMatches.length > 0 && completedCount === openMatches.length;

  const loadSavedPredictions = useCallback(async (accessToken: string) => {
    const response = await fetch(`/api/predictions?weekKey=${weekKey}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return;
    }

    const body = (await response.json()) as {
      predictions?: SavedPrediction[];
    };

    setScores((current) => {
      const next = { ...current };

      for (const prediction of body.predictions ?? []) {
        next[prediction.matchId] = {
          home: prediction.predictedHomeScore.toString(),
          away: prediction.predictedAwayScore.toString(),
          awardedPoints: prediction.awardedPoints,
          exactScore: prediction.exactScore,
          saved: true,
        };
      }

      return next;
    });
  }, [weekKey]);

  useEffect(() => {
    if (!authConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token;

      if (!accessToken) {
        setAuthState("guest");
        return;
      }

      setToken(accessToken);
      setAuthState("ready");
      await loadSavedPredictions(accessToken);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token ?? null;
      setToken(accessToken);
      setAuthState(accessToken ? "ready" : "guest");

      if (accessToken) {
        loadSavedPredictions(accessToken);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [authConfigured, loadSavedPredictions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      router.push("/login");
      return;
    }

    if (!allOpenMatchesCompleted) {
      setMessage("Enter scores for every open match this week.");
      return;
    }

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        predictions: openMatches.map((match) => ({
          matchId: match.id,
          predictedHomeScore: Number(scores[match.id]?.home),
          predictedAwayScore: Number(scores[match.id]?.away),
        })),
      }),
    });
    const body = await response.json().catch(() => ({}));

    setSaving(false);

    if (!response.ok) {
      setMessage(body.error ?? "Unable to save predictions.");
      return;
    }

    await loadSavedPredictions(token);
    setMessage("Predictions saved.");
  }

  function updateScore(matchId: string, side: "home" | "away", value: string) {
    const cleanValue = value.replace(/\D/g, "").slice(0, 2);

    setScores((current) => ({
      ...current,
      [matchId]: {
        ...current[matchId],
        [side]: cleanValue,
        saved: false,
      },
    }));
  }

  if (!matches.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <FiCalendar className="mx-auto h-6 w-6 text-red-500" aria-hidden="true" />
        <p className="mt-3 text-sm font-bold text-slate-950">
          No matches in this prediction week
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          New fixtures will appear here once the schedule is updated.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">
              {weekTitle}
            </p>
            <h2 className="mt-1 text-base font-bold text-slate-950">
              Weekly Predictions
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {completedCount}/{openMatches.length} open matches completed
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {authState === "guest" ? (
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-red-600"
              >
                Sign in
                <FiTarget className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : null}
            <button
              type="submit"
              disabled={
                authState !== "ready" ||
                saving ||
                openMatches.length === 0 ||
                !allOpenMatchesCompleted
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving" : "Save predictions"}
              <FiSave className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {message ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
            {message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3">
        {matches.map((match) => (
          <PredictionMatchCard
            key={match.id}
            match={match}
            score={scores[match.id] ?? { home: "", away: "" }}
            disabled={authState !== "ready" || match.locked}
            onScoreChange={updateScore}
          />
        ))}
      </div>
    </form>
  );
}

function PredictionMatchCard({
  match,
  score,
  disabled,
  onScoreChange,
}: {
  match: WeeklyPredictionMatch;
  score: ScoreState[string];
  disabled: boolean;
  onScoreChange: (matchId: string, side: "home" | "away", value: string) => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <FiClock className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
          {formatMatchDate(match.date)} / {formatMatchTime(match.date)}
        </span>
        <span>{match.matchday}</span>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)] items-center gap-3">
        <TeamBlock team={match.homeTeam} />
        <div className="grid grid-cols-2 gap-1">
          <ScoreInput
            label={match.homeTeam.shortName}
            value={score.home}
            disabled={disabled}
            onChange={(value) => onScoreChange(match.id, "home", value)}
          />
          <ScoreInput
            label={match.awayTeam.shortName}
            value={score.away}
            disabled={disabled}
            onChange={(value) => onScoreChange(match.id, "away", value)}
          />
        </div>
        <TeamBlock team={match.awayTeam} align="right" />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs font-bold text-slate-500">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <FiMapPin className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
          <span className="truncate">{match.venueName}</span>
        </span>
        <span
          className={`inline-flex items-center gap-1.5 ${
            match.locked
              ? "text-slate-400"
              : score.saved
                ? "text-emerald-600"
                : "text-red-500"
          }`}
        >
          {match.locked ? (
            <>
              <FiLock className="h-3.5 w-3.5" aria-hidden="true" />
              Locked
            </>
          ) : score.saved ? (
            <>
              <FiCheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Saved
            </>
          ) : (
            "Open"
          )}
        </span>
      </div>
    </article>
  );
}

function ScoreInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        inputMode="numeric"
        className="h-11 min-w-0 rounded-lg border border-slate-200 bg-white text-center text-base font-bold text-slate-950 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:bg-slate-50 disabled:text-slate-400"
        placeholder="0"
      />
    </label>
  );
}

function TeamBlock({
  team,
  align = "left",
}: {
  team: WeeklyPredictionMatch["homeTeam"];
  align?: "left" | "right";
}) {
  const logoImage = (
    <Image
      src={team.logo}
      alt={`${team.name} logo`}
      width={34}
      height={34}
      className="h-8 w-8 shrink-0 object-contain"
    />
  );

  if (align === "right") {
    return (
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-right">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950">
            {team.name}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            {team.shortName}
          </p>
        </div>
        {logoImage}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
      {logoImage}
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-950">{team.name}</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {team.shortName}
        </p>
      </div>
    </div>
  );
}

function createEmptyScores(matches: WeeklyPredictionMatch[]): ScoreState {
  return Object.fromEntries(
    matches.map((match) => [match.id, { home: "", away: "" }]),
  );
}

function formatMatchDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}

function formatMatchTime(date: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}

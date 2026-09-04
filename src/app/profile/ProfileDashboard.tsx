"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiAward,
  FiCheckCircle,
  FiEdit3,
  FiLogOut,
  FiTarget,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import {
  getSupabaseBrowserClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-client";

type LeaderboardEntry = {
  id: string;
  name: string;
  username: string | null;
  totalPoints: number;
  bonusPoints: number;
  perfectWeeks: number;
  predictionCount: number;
};

type ProfileResponse = {
  profile: {
    id: string;
    email: string | null;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
    favoriteTeamId: string | null;
  };
  summary: {
    totalPoints: number;
    basePoints: number;
    bonusPoints: number;
    perfectWeeks: number;
    thisWeekPoints: number;
    thisMonthPoints: number;
    predictionCount: number;
    exactScores: number;
    rank: number | null;
    weeklyRank: number | null;
    monthlyRank: number | null;
  };
  recentPredictions: Array<{
    id: string;
    predictedHomeScore: number;
    predictedAwayScore: number;
    awardedPoints: number;
    exactScore: boolean;
    match: {
      slug: string;
      matchday: string;
      status: string;
      homeScore: number | null;
      awayScore: number | null;
      competitionName: string;
      homeTeam: { name: string; shortName: string };
      awayTeam: { name: string; shortName: string };
    };
  }>;
  leaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  monthlyLeaderboard: LeaderboardEntry[];
};

type LoadState = "loading" | "guest" | "ready" | "error";

const SUPABASE_UNCONFIGURED_MESSAGE =
  "Supabase auth is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env, then restart the dev server.";

export default function ProfileDashboard() {
  const router = useRouter();
  const authConfigured = isSupabaseAuthConfigured();
  const [state, setState] = useState<LoadState>(() =>
    authConfigured ? "loading" : "error",
  );
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState(() =>
    authConfigured ? "" : SUPABASE_UNCONFIGURED_MESSAGE,
  );
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    favoriteTeamId: "",
  });

  const loadProfile = useCallback(async (accessToken: string) => {
    setState("loading");
    setMessage("");

    const response = await fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      setState("guest");
      return;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error ?? "Unable to load profile.");
      setState("error");
      return;
    }

    const profileData = (await response.json()) as ProfileResponse;
    setData(profileData);
    setForm({
      displayName: profileData.profile.displayName ?? "",
      username: profileData.profile.username ?? "",
      favoriteTeamId: profileData.profile.favoriteTeamId ?? "",
    });
    setState("ready");
  }, []);

  useEffect(() => {
    if (!authConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setState("guest");
        return;
      }

      setToken(accessToken);
      await loadProfile(accessToken);
    });
  }, [authConfigured, loadProfile]);

  async function handleProfileUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) return;

    setMessage("Saving profile...");

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(body.error ?? "Unable to save profile.");
      return;
    }

    await loadProfile(token);
    setMessage("Profile updated.");
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (state === "loading") {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6">
        <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </section>
    );
  }

  if (state === "guest") {
    return (
      <section className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-xl items-center px-4 py-8 text-center sm:px-6">
        <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-500">
            <FiUser className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-950">
            Sign in to view your profile
          </h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Your prediction points and history are saved to your fan account.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-600"
          >
            Sign in
            <FiArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  if (state === "error" || !data) {
    return (
      <section className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-xl items-center px-4 py-8 text-center sm:px-6">
        <div className="w-full rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="text-sm font-bold">{message}</p>
        </div>
      </section>
    );
  }

  const profileName = data.profile.displayName ?? "Apex fan";
  const initials = profileName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 rounded-lg bg-slate-950 p-5 text-white shadow-sm sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-red-500 text-lg font-bold">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-200">
              Fan Profile
            </p>
            <h1 className="truncate text-2xl font-bold tracking-normal">
              {profileName}
            </h1>
            <p className="truncate text-sm font-semibold text-slate-300">
              {data.profile.email}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/predict"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-xs font-bold text-slate-950 transition hover:bg-red-50 hover:text-red-500"
          >
            Predict
            <FiTarget className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/20 px-4 text-xs font-bold text-white transition hover:bg-white/10"
          >
            Sign out
            <FiLogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileMetric
          label="Total Points"
          value={data.summary.totalPoints.toString()}
          icon={FiAward}
        />
        <ProfileMetric
          label="Overall Rank"
          value={data.summary.rank ? `#${data.summary.rank}` : "-"}
          icon={FiAward}
        />
        <ProfileMetric
          label="This Week"
          value={data.summary.thisWeekPoints.toString()}
          icon={FiTrendingUp}
        />
        <ProfileMetric
          label="Week Rank"
          value={data.summary.weeklyRank ? `#${data.summary.weeklyRank}` : "-"}
          icon={FiAward}
        />
        <ProfileMetric
          label="This Month"
          value={data.summary.thisMonthPoints.toString()}
          icon={FiTrendingUp}
        />
        <ProfileMetric
          label="Month Rank"
          value={data.summary.monthlyRank ? `#${data.summary.monthlyRank}` : "-"}
          icon={FiAward}
        />
        <ProfileMetric
          label="Exact Picks"
          value={data.summary.exactScores.toString()}
          icon={FiCheckCircle}
        />
        <ProfileMetric
          label="Bonus Points"
          value={data.summary.bonusPoints.toString()}
          icon={FiTarget}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">
                Prediction History
              </p>
              <h2 className="text-lg font-bold text-slate-950">
                Recent Predictions
              </h2>
            </div>
            <Link
              href="/predict"
              className="inline-flex items-center gap-1 text-xs font-bold text-red-500"
            >
              This week
              <FiArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-3">
            {data.recentPredictions.length ? (
              data.recentPredictions.map((prediction) => (
                <PredictionHistoryRow
                  key={prediction.id}
                  prediction={prediction}
                />
              ))
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
                No predictions submitted yet.
              </div>
            )}
          </div>
        </section>

        <div className="space-y-4">
          <form
            onSubmit={handleProfileUpdate}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <FiEdit3 className="h-4 w-4 text-red-500" aria-hidden="true" />
              <h2 className="text-sm font-bold text-slate-950">
                Profile Details
              </h2>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-xs font-bold text-slate-600">
                Display name
                <input
                  value={form.displayName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-600">
                Username
                <input
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  placeholder="apexfan"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 h-10 w-full rounded-lg bg-red-500 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-red-600"
            >
              Save Profile
            </button>

            {message ? (
              <p className="mt-3 text-xs font-bold text-slate-500">
                {message}
              </p>
            ) : null}
          </form>

          <RankingList
            title="Overall Ranking"
            items={data.leaderboard}
            emptyLabel="No leaderboard entries yet."
          />
          <RankingList
            title="Weekly Ranking"
            items={data.weeklyLeaderboard}
            emptyLabel="No predictions in this week yet."
          />
          <RankingList
            title="Monthly Ranking"
            items={data.monthlyLeaderboard}
            emptyLabel="No predictions in this month yet."
          />
        </div>
      </div>
    </section>
  );
}

function RankingList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: LeaderboardEntry[];
  emptyLabel: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-950">{title}</h2>
      <div className="mt-4 divide-y divide-slate-100">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">
                  #{index + 1} {item.name}
                </p>
                <p className="text-[11px] font-semibold text-slate-500">
                  {item.predictionCount} predictions / {item.perfectWeeks}{" "}
                  perfect weeks
                </p>
              </div>
              <span className="text-sm font-bold text-red-500">
                {item.totalPoints} pts
              </span>
            </div>
          ))
        ) : (
          <p className="py-4 text-xs font-semibold text-slate-500">
            {emptyLabel}
          </p>
        )}
      </div>
    </section>
  );
}

function ProfileMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: IconType;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <Icon className="h-4 w-4 text-red-500" aria-hidden="true" />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function PredictionHistoryRow({
  prediction,
}: {
  prediction: ProfileResponse["recentPredictions"][number];
}) {
  const actualScore =
    typeof prediction.match.homeScore === "number" &&
    typeof prediction.match.awayScore === "number"
      ? `${prediction.match.homeScore} - ${prediction.match.awayScore}`
      : "Pending";

  return (
    <Link
      href={`/matches/${prediction.match.slug}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-500 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
            {prediction.match.competitionName} / {prediction.match.matchday}
          </p>
          <h3 className="mt-1 truncate text-sm font-bold text-slate-950">
            {prediction.match.homeTeam.name} vs {prediction.match.awayTeam.name}
          </h3>
        </div>
        <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-500">
          {prediction.awardedPoints} pts
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-bold text-slate-600">
        <p>
          Pick: {prediction.predictedHomeScore} -{" "}
          {prediction.predictedAwayScore}
        </p>
        <p>Actual: {actualScore}</p>
      </div>
    </Link>
  );
}

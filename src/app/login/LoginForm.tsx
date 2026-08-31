"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiMail, FiUser } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import {
  getSupabaseBrowserClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-client";

type Status = "idle" | "sending" | "sent" | "error";

const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export default function LoginForm() {
  const router = useRouter();
  const authConfigured = isSupabaseAuthConfigured();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/profile");
      }
    });
  }, [authConfigured, router]);

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authConfigured) {
      setStatus("error");
      setMessage("Set the Supabase auth keys before signing in.");
      return;
    }

    if (!email.trim()) {
      setStatus("error");
      setMessage("Enter your email address.");
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = getAuthCallbackUrl();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("sent");
      setMessage("Check your email for the sign-in link.");
    } catch (error) {
      setStatus("error");
      setMessage(getAuthErrorMessage(error, "Unable to send sign-in link."));
    }
  }

  async function handleGoogleLogin() {
    if (!authConfigured) {
      setStatus("error");
      setMessage("Set the Supabase auth keys before signing in.");
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = getAuthCallbackUrl();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      if (!data.url) {
        setStatus("error");
        setMessage("Unable to start Google sign-in.");
        return;
      }

      window.location.assign(data.url);
    } catch (error) {
      setStatus("error");
      setMessage(getAuthErrorMessage(error, "Unable to start Google sign-in."));
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-6xl items-center px-4 py-8 sm:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="rounded-lg bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-red-500">
            <FiUser className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-2xl font-bold tracking-normal sm:text-3xl">
            Apex League Profile
          </h1>
          <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-slate-300">
            Sign in to save weekly predictions, track points, and climb the fan
            leaderboard.
          </p>
          <div className="mt-6 grid gap-3 text-sm font-bold text-slate-200">
            <p>Exact score: 5 points</p>
            <p>Wrong score: 0 points</p>
            <p>Perfect week: 10 bonus points</p>
            <p>Predictions lock at kickoff</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">
            Fan Login
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Continue to your profile
          </h2>

          <form onSubmit={handleEmailLogin} className="mt-5 grid gap-4">
            <label className="grid gap-1 text-xs font-bold text-slate-600">
              Email address
              <span className="relative block">
                <FiMail
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={!authConfigured || status === "sending"}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </span>
            </label>

            <button
              type="submit"
              disabled={!authConfigured || status === "sending"}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-red-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Email sign-in link
              <FiArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Or
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={!authConfigured || status === "sending"}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 shadow-sm transition hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FcGoogle className="h-5 w-5" aria-hidden="true" />
            Continue with Google
          </button>

          {!authConfigured ? (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-800">
              Supabase auth is not configured yet. Add
              NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
              your .env file, then restart the dev server.
            </p>
          ) : null}

          {message ? (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-xs font-bold ${
                status === "error"
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {message}
            </p>
          ) : null}

          <p className="mt-5 text-xs font-semibold leading-5 text-slate-500">
            New accounts are created automatically after sign-in.
          </p>
          <Link
            href="/predict"
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-red-500"
          >
            Back to predictions
            <FiArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function getAuthCallbackUrl() {
  const callbackUrl = new URL("/auth/callback", getAppOrigin());
  callbackUrl.searchParams.set("next", getSafeNextPath());

  return callbackUrl.toString();
}

function getAppOrigin() {
  const browserOrigin = normalizeOrigin(window.location.origin);

  if (browserOrigin) {
    return browserOrigin;
  }

  return normalizeOrigin(PUBLIC_SITE_URL) ?? "http://localhost:3000";
}

function normalizeOrigin(value?: string) {
  const cleanValue = value?.trim().replace(/^["']|["']$/g, "");

  if (!cleanValue || cleanValue === "null") {
    return null;
  }

  try {
    return new URL(cleanValue).origin;
  } catch {
    return null;
  }
}

function getSafeNextPath() {
  const next = new URLSearchParams(window.location.search).get("next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/profile";
  }

  try {
    const parsed = new URL(next, window.location.origin);

    if (parsed.origin !== window.location.origin) {
      return "/profile";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/profile";
  }
}

function getAuthErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiCheckCircle, FiUser } from "react-icons/fi";
import {
  getSupabaseBrowserClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-client";

type CallbackState = "loading" | "error";

const SESSION_WAIT_MS = 6000;
const SUPABASE_UNCONFIGURED_MESSAGE =
  "Supabase auth is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env, then restart the dev server.";

export default function AuthCallback() {
  const router = useRouter();
  const authConfigured = isSupabaseAuthConfigured();
  const [state, setState] = useState<CallbackState>(() =>
    authConfigured ? "loading" : "error",
  );
  const [message, setMessage] = useState(() =>
    authConfigured
      ? "Completing sign-in..."
      : SUPABASE_UNCONFIGURED_MESSAGE,
  );

  useEffect(() => {
    if (!authConfigured) {
      return;
    }

    let cancelled = false;
    let fallbackTimer: number | null = null;
    const { accessToken, authError, code, nextPath, refreshToken } =
      readCallbackUrl();

    if (authError) {
      fallbackTimer = window.setTimeout(() => {
        if (!cancelled) {
          setState("error");
          setMessage(authError);
        }
      }, 0);

      return () => {
        cancelled = true;

        if (fallbackTimer) {
          window.clearTimeout(fallbackTimer);
        }
      };
    }

    const supabase = getSupabaseBrowserClient();
    const navigateToNextPath = () => {
      if (!cancelled) {
        router.replace(nextPath);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigateToNextPath();
      }
    });

    async function completeSignIn() {
      try {
        await Promise.resolve();

        if (authError) {
          setState("error");
          setMessage(authError);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          clearCallbackHash();
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          navigateToNextPath();
          return;
        }

        fallbackTimer = window.setTimeout(() => {
          if (!cancelled) {
            setState("error");
            setMessage(
              "We could not finish sign-in. Please try again from the login page.",
            );
          }
        }, SESSION_WAIT_MS);
      } catch (error) {
        if (!cancelled) {
          setState("error");
          setMessage(getAuthErrorMessage(error));
        }
      }
    }

    completeSignIn();

    return () => {
      cancelled = true;
      subscription.unsubscribe();

      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
    };
  }, [authConfigured, router]);

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-9rem)] w-full max-w-xl items-center px-4 py-8 text-center sm:px-6">
      <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <span
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${
            state === "error"
              ? "bg-red-50 text-red-500"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {state === "error" ? (
            <FiUser className="h-5 w-5" aria-hidden="true" />
          ) : (
            <FiCheckCircle className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
        <h1 className="mt-4 text-xl font-bold text-slate-950">
          {state === "error" ? "Sign-in needs another try" : "Signing you in"}
        </h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          {message}
        </p>

        {state === "error" ? (
          <Link
            href="/login"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-600"
          >
            Back to login
            <FiArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function readCallbackUrl() {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const authError =
    url.searchParams.get("error_description") ??
    hashParams.get("error_description") ??
    url.searchParams.get("error") ??
    hashParams.get("error");

  return {
    authError,
    accessToken: hashParams.get("access_token"),
    code: url.searchParams.get("code") ?? hashParams.get("code"),
    nextPath: getSafeNextPath(
      url.searchParams.get("next") ?? hashParams.get("next"),
    ),
    refreshToken: hashParams.get("refresh_token"),
  };
}

function clearCallbackHash() {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

function getSafeNextPath(next: string | null) {
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

function getAuthErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "We could not finish sign-in. Please try again from the login page.";
}

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase-client";

const ENTRY_SIGN_IN_OFFERED_KEY = "jval-entry-sign-in-offered";

const skippedPathPrefixes = ["/login", "/auth", "/admin"];

export default function FirstVisitSignInGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseAuthConfigured()) return;

    if (skippedPathPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return;
    }

    if (window.sessionStorage.getItem(ENTRY_SIGN_IN_OFFERED_KEY) === "true") {
      return;
    }

    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled || data.session) {
        return;
      }

      window.sessionStorage.setItem(ENTRY_SIGN_IN_OFFERED_KEY, "true");
      router.replace(`/login?next=${encodeURIComponent(getCurrentPath())}`);
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}

function getCurrentPath() {
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
}

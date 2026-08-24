import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { loginAdmin } from "../actions";
import { getAdminSession, getDevAdminHint } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Login | Johnvents Apex League",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [query, session] = await Promise.all([searchParams, getAdminSession()]);

  if (session) {
    redirect("/admin");
  }

  const devHint = getDevAdminHint();
  const hasError = query.error === "invalid";

  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <div className="mx-auto grid min-h-dvh max-w-6xl px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
        <section className="flex min-h-[260px] flex-col justify-between rounded-lg border border-white/10 bg-white/5 p-6 lg:min-h-[580px] lg:p-8">
          <div className="flex items-center gap-3">
            <Image src="/JV Logo.webp" alt="Johnvents" width={78} height={36} className="h-auto w-[78px] rounded bg-white p-1" />
            <Image src="/Apex Logo.png" alt="Apex League" width={92} height={44} className="h-auto w-[92px]" />
          </div>

          <div className="mt-12 max-w-xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
              Powered by Johnvents Foods
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              Johnvents Apex League Admin
            </h1>
            <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-slate-300">
              Tournament operations, fixtures, live updates, squads, media, awards, and season archives.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 text-sm">
            <StatusChip label="Season" value="2026/2027" />
            <StatusChip label="Mode" value="Preview" />
            <StatusChip label="Access" value="Admin" />
          </div>
        </section>

        <section className="mt-6 rounded-lg bg-white p-5 text-slate-950 shadow-xl sm:p-6 lg:mt-0">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Secure Login
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-normal">Admin account</h2>
          </div>

          {hasError ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Invalid admin email or password.
            </div>
          ) : null}

          <form action={loginAdmin} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Email
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                defaultValue={devHint?.email}
                className="h-12 rounded-lg border border-slate-200 bg-white px-3 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                defaultValue={devHint?.password}
                className="h-12 rounded-lg border border-slate-200 bg-white px-3 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <button
              type="submit"
              className="mt-2 inline-flex h-12 items-center justify-center rounded-lg bg-blue-700 px-5 text-sm font-black text-white transition hover:bg-blue-800"
            >
              Sign in
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { FiExternalLink, FiLogOut } from "react-icons/fi";
import { logoutAdmin } from "../actions";
import AdminNav from "./AdminNav";
import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/admin-permissions";

type AdminShellProps = {
  children: React.ReactNode;
  email: string;
  role: AdminRole;
};

export default function AdminShell({ children, email, role }: AdminShellProps) {
  return (
    <div className="min-h-dvh bg-[#fffafa] text-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-white px-3 py-3 sm:px-4 sm:py-4 lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 sm:gap-3"
              aria-label="Admin overview"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 sm:h-11 sm:w-11">
                <Image
                  src="/Apex Logo.png"
                  alt="Apex League"
                  width={34}
                  height={34}
                  className="h-7 w-7 object-contain sm:h-8 sm:w-8"
                />
              </span>
              <span>
                <span className="block text-sm font-bold leading-4">
                  Apex Admin
                </span>
                <span className="block text-[10px] font-bold text-slate-500 sm:text-[11px]">
                  Powered by Johnvents Foods
                </span>
              </span>
            </Link>

            <Link
              href="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-red-500 lg:hidden"
              aria-label="View public site"
              title="View public site"
            >
              <FiExternalLink aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-4 lg:mt-8">
            <AdminNav role={role} />
          </div>

          <div className="mt-5 hidden rounded-lg border border-slate-200 bg-slate-50 p-3 lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
              Signed in
            </p>
            <p className="mt-1 truncate text-sm font-bold text-slate-950">
              {email}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">
              {ADMIN_ROLE_LABELS[role]}
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur sm:px-6 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-red-500">
                  Admin Dashboard
                </p>
                <p className="truncate text-sm font-medium text-slate-600">
                  {email} <br /> {ADMIN_ROLE_LABELS[role]}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:border-red-500 hover:text-red-500 sm:inline-flex"
                >
                  <FiExternalLink aria-hidden="true" />
                  Public site
                </Link>
                <form action={logoutAdmin}>
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 text-xs font-bold text-white transition hover:bg-red-500 sm:h-10 sm:gap-2 sm:px-3 sm:text-xs"
                  >
                    <FiLogOut aria-hidden="true" />
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

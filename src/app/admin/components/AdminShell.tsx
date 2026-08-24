import Image from "next/image";
import Link from "next/link";
import { FiExternalLink, FiLogOut } from "react-icons/fi";
import { logoutAdmin } from "../actions";
import AdminNav from "./AdminNav";

type AdminShellProps = {
  children: React.ReactNode;
  email: string;
};

export default function AdminShell({ children, email }: AdminShellProps) {
  return (
    <div className="min-h-dvh bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col lg:grid lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex items-center justify-between gap-4 lg:block">
            <Link href="/admin" className="flex items-center gap-3" aria-label="Admin overview">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-50">
                <Image src="/Apex Logo.png" alt="Apex League" width={34} height={34} className="h-8 w-8 object-contain" />
              </span>
              <span>
                <span className="block text-sm font-black leading-4">Apex Admin</span>
                <span className="block text-[11px] font-bold text-slate-500">Powered by Johnvents Foods</span>
              </span>
            </Link>

            <Link
              href="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-blue-700 lg:hidden"
              aria-label="View public site"
              title="View public site"
            >
              <FiExternalLink aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-4 lg:mt-8">
            <AdminNav />
          </div>

          <div className="mt-5 hidden rounded-lg border border-slate-200 bg-slate-50 p-3 lg:block">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Signed in</p>
            <p className="mt-1 truncate text-sm font-black text-slate-950">{email}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">Admin Dashboard</p>
                <p className="truncate text-sm font-bold text-slate-600">{email}</p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-700 transition hover:border-blue-600 hover:text-blue-700 sm:inline-flex"
                >
                  <FiExternalLink aria-hidden="true" />
                  Public site
                </Link>
                <form action={logoutAdmin}>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-black text-white transition hover:bg-blue-800"
                  >
                    <FiLogOut aria-hidden="true" />
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiSearch } from "react-icons/fi";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/competitions", label: "Competitions" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/tables", label: "Tables" },
  { href: "/statistics", label: "Statistics" },
  { href: "/news", label: "News" },
  { href: "/venues", label: "Venues" },
  { href: "/awards-records", label: "Awards" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Johnvents Apex League home"
          >
            <Image
              src="/JV Logo.webp"
              alt="Johnvents"
              width={50}
              height={24}
              preload
              className="h-auto w-[50px]"
            />

            <Image
              src="/Apex Logo.png"
              alt="Apex League"
              width={60}
              height={30}
              preload
              className="h-auto w-[60px]"
            />
          </Link>

          <Link
            href="/search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 hover:text-red-500"
            aria-label="Search"
            title="Search"
          >
            <FiSearch aria-hidden="true" />
          </Link>
        </div>

        <nav className="header-nav -mx-4 flex gap-1 overflow-x-auto px-4 pb-2 text-xs font-bold text-slate-600 sm:mx-0 sm:px-0 ">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-lg px-3 py-1 transition ${
                  active
                    ? " border-b-3 border-red-500 text-red-500"
                    : "hover:bg-red-50 hover:text-red-500"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

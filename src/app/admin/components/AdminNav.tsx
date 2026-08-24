"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiGrid,
  FiHome,
  FiImage,
  FiMapPin,
  FiSettings,
  FiShield,
  FiUsers,
} from "react-icons/fi";

const navItems = [
  { href: "/admin", label: "Overview", icon: FiHome },
  { href: "/admin/competitions", label: "Competitions", icon: FiGrid },
  { href: "/admin/fixtures", label: "Fixtures", icon: FiCalendar },
  { href: "/admin/teams", label: "Teams", icon: FiShield },
  { href: "/admin/players", label: "Players", icon: FiUsers },
  { href: "/admin/statistics", label: "Statistics", icon: FiBarChart2 },
  { href: "/admin/news", label: "News", icon: FiGrid },
  { href: "/admin/galleries", label: "Galleries", icon: FiImage },
  { href: "/admin/venues", label: "Venues", icon: FiMapPin },
  { href: "/admin/awards-records", label: "Awards", icon: FiAward },
  { href: "/admin/settings", label: "Settings", icon: FiSettings },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold transition lg:w-full ${
              active
                ? "bg-blue-700 text-white"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

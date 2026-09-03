"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import {
  FiAward,
  FiBarChart2,
  FiCalendar,
  FiGrid,
  FiHome,
  FiMapPin,
  FiSettings,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import {
  hasAdminPermission,
  type AdminPermission,
  type AdminRole,
} from "@/lib/admin-permissions";

const navItems: {
  href: string;
  label: string;
  icon: IconType;
  permission?: AdminPermission;
}[] = [
  { href: "/admin", label: "Overview", icon: FiHome },
  { href: "/admin/competitions", label: "Competitions", icon: FiGrid },
  { href: "/admin/fixtures", label: "Fixtures", icon: FiCalendar },
  { href: "/admin/teams", label: "Teams", icon: FiShield },
  { href: "/admin/players", label: "Players", icon: FiUsers },
  { href: "/admin/statistics", label: "Statistics", icon: FiBarChart2 },
  { href: "/admin/news", label: "News", icon: FiGrid },
  { href: "/admin/venues", label: "Venues", icon: FiMapPin },
  { href: "/admin/awards-records", label: "Awards", icon: FiAward },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: FiSettings,
    permission: "manageSettings",
  },
];

export default function AdminNav({ role }: { role: AdminRole }) {
  const pathname = usePathname();
  const visibleNavItems = navItems.filter(
    (item) => !item.permission || hasAdminPermission(role, item.permission),
  );

  return (
    <nav className="admin-nav -mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1.5 sm:-mx-4 sm:gap-2 sm:px-4 sm:pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex h-7 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[11px] font-bold transition sm:px-3 sm:text-xs lg:w-full ${
              active
                ? "border-red-500 border-b-2 text-red-500"
                : "text-slate-600 hover:bg-red-50 hover:text-red-500"
            }`}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

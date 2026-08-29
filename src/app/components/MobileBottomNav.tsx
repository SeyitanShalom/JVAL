"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiBarChart2,
  FiCalendar,
  FiGrid,
  FiHome,
  FiTarget,
} from "react-icons/fi";

const navItems = [
  { href: "/", label: "Home", icon: FiHome },
  { href: "/fixtures", label: "Fixtures", icon: FiCalendar },
  { href: "/competitions", label: "Competitions", icon: FiGrid },
  { href: "/predict", label: "Predict", icon: FiTarget },
  { href: "/statistics", label: "Stats", icon: FiBarChart2 },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="bottom-nav"
      aria-label="Primary navigation"
    >
      <div className="bottom-nav__items">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav__link ${
                active ? "bottom-nav__link--active" : ""
              }`}
              aria-current={active ? "page" : undefined}
              title={label}
            >
              <Icon className="bottom-nav__icon" aria-hidden="true" />
              <span className="bottom-nav__label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

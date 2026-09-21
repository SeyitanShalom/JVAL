"use client";

import { FiMoon, FiSun } from "react-icons/fi";

const THEME_STORAGE_KEY = "jval-theme";

function getCurrentTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");

  if (currentTheme === "dark" || currentTheme === "light") {
    return currentTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function setTheme(theme: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export default function ThemeToggle() {
  return (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950"
      aria-label="Toggle color theme"
      title="Toggle color theme"
      onClick={() => {
        setTheme(getCurrentTheme() === "dark" ? "light" : "dark");
      }}
    >
      <FiMoon className="h-4 w-4 dark:hidden" aria-hidden="true" />
      <FiSun className="hidden h-4 w-4 dark:block" aria-hidden="true" />
    </button>
  );
}

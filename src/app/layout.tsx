import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppChrome from "./components/AppChrome";

const inter = Inter({
  adjustFontFallback: true,
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Johnvents Apex League",
  description:
    "Official football tournament website for Johnvents Apex League fixtures, live scores, teams, players, tables, news, galleries, and season archives.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}

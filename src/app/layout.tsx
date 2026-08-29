import type { Metadata } from "next";
import "./globals.css";
import AppChrome from "./components/AppChrome";

export const metadata: Metadata = {
  title: "Johnvents Apex League",
  description:
    "Official football tournament website for Johnvents Apex League fixtures, live scores, teams, players, tables, news, galleries, and season archives.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AppChrome from "./components/AppChrome";

const themeInitScript = `(function(){try{var k="jval-theme";var s=localStorage.getItem(k);var p=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var t=s==="light"||s==="dark"?s:p;document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.setAttribute("data-theme","light");document.documentElement.style.colorScheme="light";}})();`;

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
    "Official football tournament website for Johnvents Apex League fixtures, live scores, teams, players, tables, news, and season archives.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}

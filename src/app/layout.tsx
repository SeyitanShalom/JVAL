import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { cookies } from "next/headers";
import "./globals.css";
import AppChrome from "./components/AppChrome";

const THEME_STORAGE_KEY = "jval-theme";
const themeInitScript = `(function(){try{var k="${THEME_STORAGE_KEY}";var s=localStorage.getItem(k);var p=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var t=s==="light"||s==="dark"?s:p;document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t;document.cookie=k+"="+t+"; Path=/; Max-Age=31536000; SameSite=Lax";}catch(e){document.documentElement.setAttribute("data-theme","light");document.documentElement.style.colorScheme="light";}})();`;

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

function isTheme(value: string | undefined): value is "dark" | "light" {
  return value === "dark" || value === "light";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get(THEME_STORAGE_KEY)?.value;
  const initialTheme = isTheme(savedTheme) ? savedTheme : "light";

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      data-theme={initialTheme}
      data-scroll-behavior="smooth"
      style={{ colorScheme: initialTheme }}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}

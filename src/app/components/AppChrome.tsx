"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <div className="pb-24">
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}

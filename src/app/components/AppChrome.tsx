"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";
import MotionObserver from "./MotionObserver";
import FirstVisitSignInGate from "./FirstVisitSignInGate";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <MotionObserver />
      <main key={pathname} data-motion-root className="page-shell flex-1">
        {children}
      </main>
      <div className="pb-24 lg:pb-0">
        <Footer />
      </div>
      <FirstVisitSignInGate />
      <MobileBottomNav />
    </>
  );
}

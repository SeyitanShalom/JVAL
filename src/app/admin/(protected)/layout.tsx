import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import AdminShell from "../components/AdminShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard | Johnvents Apex League",
};

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return <AdminShell email={session.email}>{children}</AdminShell>;
}

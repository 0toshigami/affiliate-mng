"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { UserRole } from "@/types";

const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Affiliates", href: "/admin/affiliates" },
  { label: "Programs", href: "/admin/programs" },
  { label: "Conversions", href: "/admin/conversions" },
  { label: "Commissions", href: "/admin/commissions" },
  { label: "Payouts", href: "/admin/payouts" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, fetchUser } = useAuth();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isAuthenticated && user === null) {
      router.push("/login");
    } else if (user && user.role !== UserRole.ADMIN) {
      // Redirect non-admin users to appropriate dashboard
      if (user.role === UserRole.AFFILIATE) {
        router.push("/affiliate/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [isAuthenticated, user, router]);

  if (!user || user.role !== UserRole.ADMIN) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar items={adminNavItems} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}

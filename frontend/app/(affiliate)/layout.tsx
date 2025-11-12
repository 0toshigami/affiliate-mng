"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { UserRole } from "@/types";

const affiliateNavItems = [
  { label: "Dashboard", href: "/affiliate/dashboard" },
  { label: "Programs", href: "/affiliate/programs" },
  { label: "Referral Links", href: "/affiliate/links" },
  { label: "Performance", href: "/affiliate/performance" },
  { label: "Commissions", href: "/affiliate/commissions" },
  { label: "Payouts", href: "/affiliate/payouts" },
  { label: "Profile", href: "/affiliate/profile" },
];

export default function AffiliateLayout({
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
    } else if (user && user.role !== UserRole.AFFILIATE) {
      // Redirect non-affiliate users to appropriate dashboard
      if (user.role === UserRole.ADMIN) {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    }
  }, [isAuthenticated, user, router]);

  if (!user || user.role !== UserRole.AFFILIATE) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar items={affiliateNavItems} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}

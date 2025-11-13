"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  AffiliateProfile,
  AffiliateProgram,
  Conversion,
  Commission,
  ApprovalStatus,
  ConversionStatus,
  CommissionStatus,
  ProgramStatus,
} from "@/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface DashboardStats {
  totalAffiliates: number;
  pendingAffiliates: number;
  activePrograms: number;
  totalConversions: number;
  pendingConversions: number;
  pendingCommissions: number;
  totalRevenue: number;
  approvedCommissions: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalAffiliates: 0,
    pendingAffiliates: 0,
    activePrograms: 0,
    totalConversions: 0,
    pendingConversions: 0,
    pendingCommissions: 0,
    totalRevenue: 0,
    approvedCommissions: 0,
  });
  const [recentAffiliates, setRecentAffiliates] = useState<AffiliateProfile[]>([]);
  const [recentConversions, setRecentConversions] = useState<Conversion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      // Fetch all required data in parallel
      const [
        affiliates,
        pendingAffiliates,
        programs,
        conversions,
        commissions,
        commissionStats,
      ] = await Promise.all([
        apiClient.listAffiliates({ limit: 100 }),
        apiClient.listAffiliates({ status: ApprovalStatus.PENDING, limit: 10 }),
        apiClient.listPrograms({ limit: 100 }),
        apiClient.listConversions({ limit: 10 }),
        apiClient.listCommissions({ limit: 100 }),
        apiClient.getCommissionStats(),
      ]);

      // Calculate stats
      const activePrograms = programs.filter(
        (p) => p.status === ProgramStatus.ACTIVE
      ).length;

      const pendingConversions = conversions.filter(
        (c) => c.status === ConversionStatus.PENDING
      ).length;

      const pendingCommissions = commissions.filter(
        (c) => c.status === CommissionStatus.PENDING
      ).length;

      const totalRevenue =
        commissionStats.total_paid +
        commissionStats.total_approved +
        commissionStats.total_pending;

      setStats({
        totalAffiliates: affiliates.length,
        pendingAffiliates: pendingAffiliates.length,
        activePrograms,
        totalConversions: conversions.length,
        pendingConversions,
        pendingCommissions,
        totalRevenue,
        approvedCommissions: commissionStats.total_approved,
      });

      // Set recent data
      setRecentAffiliates(pendingAffiliates.slice(0, 5));
      setRecentConversions(conversions.slice(0, 5));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const pendingActions = stats.pendingAffiliates + stats.pendingConversions + stats.pendingCommissions;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600 mt-1">Overview of your affiliate program</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Affiliates</h3>
                {stats.pendingAffiliates > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {stats.pendingAffiliates} pending
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAffiliates}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push("/admin/affiliates")}
                className="mt-2 text-blue-600"
              >
                View all →
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Active Programs</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.activePrograms}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push("/admin/programs")}
                className="mt-2 text-blue-600"
              >
                Manage →
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Conversions</h3>
                {stats.pendingConversions > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {stats.pendingConversions} pending
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalConversions}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push("/admin/conversions")}
                className="mt-2 text-blue-600"
              >
                Review →
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Pending Actions</h3>
                {pendingActions > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {pendingActions}
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-red-600">{pendingActions}</p>
              <p className="text-xs text-gray-500 mt-2">
                {stats.pendingAffiliates} affiliates, {stats.pendingConversions} conversions,{" "}
                {stats.pendingCommissions} commissions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                All-time commission value
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Approved Commissions</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(stats.approvedCommissions)}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push("/admin/payouts")}
                className="mt-2 text-blue-600"
              >
                Generate payout →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Affiliates */}
        <Card>
          <CardContent>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Pending Affiliate Applications</h3>
                {stats.pendingAffiliates > 0 && (
                  <Button
                    size="sm"
                    onClick={() => router.push("/admin/affiliates")}
                  >
                    Review All
                  </Button>
                )}
              </div>

              {recentAffiliates.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending applications</p>
              ) : (
                <div className="space-y-3">
                  {recentAffiliates.map((affiliate) => (
                    <div
                      key={affiliate.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => router.push("/admin/affiliates")}
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {affiliate.company_name || "No company name"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Code: {affiliate.affiliate_code}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(affiliate.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Conversions */}
        <Card>
          <CardContent>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Conversions</h3>
                <Button
                  size="sm"
                  onClick={() => router.push("/admin/conversions")}
                >
                  View All
                </Button>
              </div>

              {recentConversions.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent conversions</p>
              ) : (
                <div className="space-y-3">
                  {recentConversions.map((conversion) => (
                    <div
                      key={conversion.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => router.push("/admin/conversions")}
                    >
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {conversion.conversion_type.replace("_", " ")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(conversion.conversion_value)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            conversion.status === ConversionStatus.PENDING
                              ? "bg-yellow-100 text-yellow-800"
                              : conversion.status === ConversionStatus.VALIDATED
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {conversion.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(conversion.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {pendingActions > 0 && (
        <Card className="mt-6">
          <CardContent>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                {stats.pendingAffiliates > 0 && (
                  <Button onClick={() => router.push("/admin/affiliates")}>
                    Review {stats.pendingAffiliates} Pending Affiliate
                    {stats.pendingAffiliates !== 1 ? "s" : ""}
                  </Button>
                )}
                {stats.pendingConversions > 0 && (
                  <Button onClick={() => router.push("/admin/conversions")}>
                    Validate {stats.pendingConversions} Conversion
                    {stats.pendingConversions !== 1 ? "s" : ""}
                  </Button>
                )}
                {stats.pendingCommissions > 0 && (
                  <Button onClick={() => router.push("/admin/commissions")}>
                    Approve {stats.pendingCommissions} Commission
                    {stats.pendingCommissions !== 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

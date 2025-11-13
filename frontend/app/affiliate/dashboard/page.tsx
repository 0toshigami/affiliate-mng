"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  ReferralLink,
  Commission,
  CommissionStats,
  CommissionStatus,
  AffiliateProfile,
} from "@/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface DashboardStats {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  conversionRate: number;
  pendingCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
  activeLinks: number;
}

export default function AffiliateDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    conversionRate: 0,
    pendingCommissions: 0,
    approvedCommissions: 0,
    paidCommissions: 0,
    activeLinks: 0,
  });
  const [recentCommissions, setRecentCommissions] = useState<Commission[]>([]);
  const [topLinks, setTopLinks] = useState<ReferralLink[]>([]);
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      // Fetch all required data in parallel
      const [
        links,
        commissions,
        commissionStats,
        affiliateProfile,
      ] = await Promise.all([
        apiClient.listMyReferralLinks({ limit: 100 }),
        apiClient.listCommissions({ limit: 10 }),
        apiClient.getCommissionStats(),
        apiClient.getMyAffiliateProfile(),
      ]);

      // Calculate stats
      const totalClicks = links.reduce((sum, link) => sum + link.clicks_count, 0);
      const totalConversions = links.reduce((sum, link) => sum + link.conversions_count, 0);
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const activeLinks = links.filter(link => link.status === "active").length;

      const totalEarnings =
        commissionStats.total_paid +
        commissionStats.total_approved +
        commissionStats.total_pending;

      setStats({
        totalClicks,
        totalConversions,
        totalEarnings,
        conversionRate,
        pendingCommissions: commissionStats.total_pending,
        approvedCommissions: commissionStats.total_approved,
        paidCommissions: commissionStats.total_paid,
        activeLinks,
      });

      // Set recent data
      setRecentCommissions(commissions.slice(0, 5));

      // Sort links by clicks and get top 3
      const sortedLinks = [...links]
        .sort((a, b) => b.clicks_count - a.clicks_count)
        .slice(0, 3);
      setTopLinks(sortedLinks);

      setProfile(affiliateProfile);
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Affiliate Dashboard</h2>
        {profile && (
          <p className="text-gray-600 mt-1">
            Welcome back! Your affiliate code: <span className="font-mono font-semibold">{profile.affiliate_code}</span>
          </p>
        )}
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
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Clicks</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalClicks}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push("/affiliate/links")}
                className="mt-2 text-blue-600"
              >
                View links →
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Conversions</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.totalConversions}</p>
              <p className="text-xs text-gray-500 mt-2">
                From {stats.activeLinks} active link{stats.activeLinks !== 1 ? "s" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Earnings</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(stats.totalEarnings)}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push("/affiliate/commissions")}
                className="mt-2 text-blue-600"
              >
                View earnings →
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Conversion Rate</h3>
              <p className="text-3xl font-bold text-gray-900">
                {stats.conversionRate.toFixed(1)}%
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push("/affiliate/performance")}
                className="mt-2 text-blue-600"
              >
                See details →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Pending</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats.pendingCommissions)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Approved</h3>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.approvedCommissions)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ready for payout</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Paid Out</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.paidCommissions)}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push("/affiliate/payouts")}
                className="mt-1 text-blue-600"
              >
                View payouts →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Commissions */}
        <Card>
          <CardContent>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Commissions</h3>
                <Button
                  size="sm"
                  onClick={() => router.push("/affiliate/commissions")}
                >
                  View All
                </Button>
              </div>

              {recentCommissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-4">No commissions yet</p>
                  <Button
                    size="sm"
                    onClick={() => router.push("/affiliate/programs")}
                  >
                    Enroll in Programs
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCommissions.map((commission) => (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => router.push("/affiliate/commissions")}
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {formatCurrency(commission.final_amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Base: {formatCurrency(commission.base_amount)} × {commission.tier_multiplier}x
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            commission.status === CommissionStatus.PENDING
                              ? "bg-yellow-100 text-yellow-800"
                              : commission.status === CommissionStatus.APPROVED
                              ? "bg-blue-100 text-blue-800"
                              : commission.status === CommissionStatus.PAID
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {commission.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Links */}
        <Card>
          <CardContent>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Top Performing Links</h3>
                <Button
                  size="sm"
                  onClick={() => router.push("/affiliate/links")}
                >
                  Manage Links
                </Button>
              </div>

              {topLinks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-4">No referral links yet</p>
                  <Button
                    size="sm"
                    onClick={() => router.push("/affiliate/links")}
                  >
                    Create Your First Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {topLinks.map((link) => (
                    <div
                      key={link.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => router.push("/affiliate/links")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm font-mono">{link.link_code}</p>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            link.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {link.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Clicks</p>
                          <p className="font-semibold">{link.clicks_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Conversions</p>
                          <p className="font-semibold">{link.conversions_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rate</p>
                          <p className="font-semibold">
                            {link.clicks_count > 0
                              ? ((link.conversions_count / link.clicks_count) * 100).toFixed(1)
                              : 0}%
                          </p>
                        </div>
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
      <Card className="mt-6">
        <CardContent>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => router.push("/affiliate/links")}>
                Create Referral Link
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/affiliate/programs")}
              >
                Browse Programs
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push("/affiliate/performance")}
              >
                View Detailed Analytics
              </Button>
              {stats.approvedCommissions > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => router.push("/affiliate/commissions")}
                >
                  View {formatCurrency(stats.approvedCommissions)} Approved
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Tip */}
      {stats.totalClicks === 0 && (
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🚀 Getting Started
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Start earning commissions by creating your first referral link!
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 mb-4">
                <li>Enroll in an affiliate program</li>
                <li>Create a referral link with your tracking code</li>
                <li>Share your link on social media, blogs, or with your network</li>
                <li>Earn commissions when people sign up or purchase through your link</li>
              </ol>
              <Button onClick={() => router.push("/affiliate/programs")}>
                Browse Available Programs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

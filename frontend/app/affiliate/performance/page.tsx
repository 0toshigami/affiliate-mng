"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  ReferralLink,
  Commission,
  CommissionStats,
  CommissionStatus,
} from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface PerformanceMetrics {
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
  averageCommission: number;
  conversionRate: number;
  clicksThisMonth: number;
  conversionsThisMonth: number;
  earningsThisMonth: number;
}

export default function AffiliatePerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    averageCommission: 0,
    conversionRate: 0,
    clicksThisMonth: 0,
    conversionsThisMonth: 0,
    earningsThisMonth: 0,
  });
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPerformanceData = async () => {
    try {
      const [linksData, commissionsData, commissionStats] = await Promise.all([
        apiClient.listMyReferralLinks({ limit: 100 }),
        apiClient.listCommissions({ limit: 100 }),
        apiClient.getCommissionStats(),
      ]);

      // Calculate metrics
      const totalClicks = linksData.reduce((sum, link) => sum + link.clicks_count, 0);
      const totalConversions = linksData.reduce(
        (sum, link) => sum + link.conversions_count,
        0
      );
      const totalEarnings =
        commissionStats.total_paid +
        commissionStats.total_approved +
        commissionStats.total_pending;
      const averageCommission =
        commissionsData.length > 0
          ? commissionsData.reduce((sum, c) => sum + c.final_amount, 0) /
            commissionsData.length
          : 0;
      const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

      // Calculate this month's metrics
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisMonthCommissions = commissionsData.filter(
        (c) => new Date(c.created_at) >= firstDayOfMonth
      );
      const earningsThisMonth = thisMonthCommissions.reduce(
        (sum, c) => sum + c.final_amount,
        0
      );

      // Approximate clicks and conversions this month (based on links created this month)
      const thisMonthLinks = linksData.filter(
        (l) => new Date(l.created_at) >= firstDayOfMonth
      );
      const clicksThisMonth = thisMonthLinks.reduce(
        (sum, link) => sum + link.clicks_count,
        0
      );
      const conversionsThisMonth = thisMonthLinks.reduce(
        (sum, link) => sum + link.conversions_count,
        0
      );

      setMetrics({
        totalClicks,
        totalConversions,
        totalEarnings,
        averageCommission,
        conversionRate,
        clicksThisMonth,
        conversionsThisMonth,
        earningsThisMonth,
      });

      // Sort links by performance
      const sortedLinks = [...linksData].sort(
        (a, b) => b.conversions_count - a.conversions_count
      );
      setLinks(sortedLinks);

      setCommissions(commissionsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getPerformanceGrade = (rate: number): { grade: string; color: string } => {
    if (rate >= 10) return { grade: "A+", color: "text-green-600" };
    if (rate >= 5) return { grade: "A", color: "text-green-600" };
    if (rate >= 3) return { grade: "B", color: "text-blue-600" };
    if (rate >= 1) return { grade: "C", color: "text-yellow-600" };
    return { grade: "D", color: "text-red-600" };
  };

  const performanceGrade = getPerformanceGrade(metrics.conversionRate);

  if (isLoading) {
    return <div className="p-6">Loading performance data...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Performance Analytics</h2>
        <p className="text-gray-600 mt-1">Detailed insights into your affiliate performance</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Overall Performance Score */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Overall Performance Score
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Based on your conversion rate and consistency
                </p>
                <div className="flex items-baseline gap-3">
                  <span className={`text-6xl font-bold ${performanceGrade.color}`}>
                    {performanceGrade.grade}
                  </span>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {metrics.conversionRate.toFixed(2)}%
                    </p>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(metrics.totalEarnings)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Clicks</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalClicks}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.clicksThisMonth} this month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Conversions</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.totalConversions}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.conversionsThisMonth} this month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Average Commission</h3>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(metrics.averageCommission)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per conversion</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">This Month</h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(metrics.earningsThisMonth)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.conversionsThisMonth} conversions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Link Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Performing Links */}
        <Card>
          <CardHeader>
            <CardTitle>Link Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No referral links created yet
              </p>
            ) : (
              <div className="space-y-3">
                {links.slice(0, 10).map((link, index) => {
                  const linkConversionRate =
                    link.clicks_count > 0
                      ? (link.conversions_count / link.clicks_count) * 100
                      : 0;

                  return (
                    <div
                      key={link.id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-500">
                            #{index + 1}
                          </span>
                          <p className="font-medium text-sm font-mono">{link.link_code}</p>
                        </div>
                        <Badge
                          variant={link.status === "active" ? "success" : "default"}
                        >
                          {link.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500 mb-1">Clicks</p>
                          <p className="font-semibold text-lg">{link.clicks_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Conversions</p>
                          <p className="font-semibold text-lg">{link.conversions_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Rate</p>
                          <p className="font-semibold text-lg">
                            {linkConversionRate.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Grade</p>
                          <p
                            className={`font-semibold text-lg ${
                              getPerformanceGrade(linkConversionRate).color
                            }`}
                          >
                            {getPerformanceGrade(linkConversionRate).grade}
                          </p>
                        </div>
                      </div>

                      {link.utm_params && Object.keys(link.utm_params).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            UTM:{" "}
                            {Object.entries(link.utm_params)
                              .map(([key, value]) => `${key}=${value}`)
                              .join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No commissions earned yet</p>
            ) : (
              <div>
                {/* Status Summary */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Pending</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {commissions.filter((c) => c.status === CommissionStatus.PENDING)
                        .length}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Approved</p>
                    <p className="text-xl font-bold text-blue-600">
                      {
                        commissions.filter((c) => c.status === CommissionStatus.APPROVED)
                          .length
                      }
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Paid</p>
                    <p className="text-xl font-bold text-green-600">
                      {commissions.filter((c) => c.status === CommissionStatus.PAID).length}
                    </p>
                  </div>
                </div>

                {/* Recent Commissions */}
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Recent Commissions
                </h4>
                <div className="space-y-2">
                  {commissions.slice(0, 8).map((commission) => (
                    <div
                      key={commission.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {formatCurrency(commission.final_amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          commission.status === CommissionStatus.PENDING
                            ? "warning"
                            : commission.status === CommissionStatus.APPROVED
                            ? "default"
                            : commission.status === CommissionStatus.PAID
                            ? "success"
                            : "danger"
                        }
                      >
                        {commission.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.conversionRate === 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">🚀 Get Started</h4>
                <p className="text-sm text-blue-800">
                  You haven't tracked any conversions yet. Make sure you're sharing your
                  referral links and tracking clicks properly.
                </p>
              </div>
            )}

            {metrics.conversionRate > 0 && metrics.conversionRate < 1 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">
                  📈 Improve Your Conversion Rate
                </h4>
                <p className="text-sm text-yellow-800 mb-2">
                  Your conversion rate is below 1%. Here are some tips:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                  <li>Target more qualified traffic sources</li>
                  <li>Improve your promotional content</li>
                  <li>Use compelling call-to-actions</li>
                  <li>Test different UTM parameters to identify best sources</li>
                </ul>
              </div>
            )}

            {metrics.conversionRate >= 1 && metrics.conversionRate < 3 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">✅ Good Progress!</h4>
                <p className="text-sm text-green-800">
                  Your conversion rate is above average. Keep focusing on your
                  top-performing links and scaling what works.
                </p>
              </div>
            )}

            {metrics.conversionRate >= 3 && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">
                  🌟 Excellent Performance!
                </h4>
                <p className="text-sm text-purple-800">
                  You're performing exceptionally well! Consider sharing your strategies
                  or scaling your efforts to maximize earnings.
                </p>
              </div>
            )}

            {links.length > 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Quick Stats</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Active Links</p>
                    <p className="font-semibold">
                      {links.filter((l) => l.status === "active").length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Best Link Rate</p>
                    <p className="font-semibold">
                      {links.length > 0 && links[0].clicks_count > 0
                        ? (
                            (links[0].conversions_count / links[0].clicks_count) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Programs</p>
                    <p className="font-semibold">
                      {new Set(links.map((l) => l.program_id)).size}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg per Link</p>
                    <p className="font-semibold">
                      {links.length > 0
                        ? (metrics.totalClicks / links.length).toFixed(0)
                        : 0}{" "}
                      clicks
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

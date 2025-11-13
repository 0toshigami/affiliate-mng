"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  AffiliateProfile,
  AffiliateProgram,
  Commission,
  Conversion,
  Payout,
  CommissionStats,
  PayoutStats,
  CommissionStatus,
  ConversionStatus,
  ProgramStatus,
} from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface AnalyticsData {
  totalRevenue: number;
  totalCommissions: number;
  totalPayouts: number;
  totalConversions: number;
  averageCommission: number;
  overallConversionRate: number;
  topAffiliates: Array<{
    affiliate: AffiliateProfile;
    revenue: number;
    conversions: number;
    commissions: number;
  }>;
  topPrograms: Array<{
    program: AffiliateProgram;
    revenue: number;
    conversions: number;
    enrollments: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    commissions: number;
  }>;
  conversionsByType: Record<string, number>;
  commissionsByStatus: {
    pending: number;
    approved: number;
    paid: number;
    rejected: number;
  };
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalCommissions: 0,
    totalPayouts: 0,
    totalConversions: 0,
    averageCommission: 0,
    overallConversionRate: 0,
    topAffiliates: [],
    topPrograms: [],
    revenueByMonth: [],
    conversionsByType: {},
    commissionsByStatus: {
      pending: 0,
      approved: 0,
      paid: 0,
      rejected: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeframe, setTimeframe] = useState<"all" | "month" | "quarter">("all");

  const fetchAnalytics = async () => {
    try {
      // Fetch all data in parallel
      const [
        affiliates,
        programs,
        commissions,
        conversions,
        commissionStats,
        payoutStats,
      ] = await Promise.all([
        apiClient.listAffiliates({ limit: 100 }),
        apiClient.listPrograms({ limit: 100 }),
        apiClient.listCommissions({ limit: 100 }),
        apiClient.listConversions({ limit: 100 }),
        apiClient.getCommissionStats(),
        apiClient.getPayoutStats(),
      ]);

      // Filter by timeframe
      const now = new Date();
      let startDate = new Date(0); // Beginning of time

      if (timeframe === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (timeframe === "quarter") {
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      }

      const filteredCommissions = commissions.filter(
        (c) => new Date(c.created_at) >= startDate
      );
      const filteredConversions = conversions.filter(
        (c) => new Date(c.created_at) >= startDate
      );

      // Calculate total revenue
      const totalRevenue = filteredCommissions.reduce(
        (sum, c) => sum + c.final_amount,
        0
      );

      // Calculate average commission
      const averageCommission =
        filteredCommissions.length > 0
          ? totalRevenue / filteredCommissions.length
          : 0;

      // Calculate overall conversion rate (from all clicks to conversions)
      // Note: This is an approximation since we don't track all clicks
      const validatedConversions = filteredConversions.filter(
        (c) => c.status === ConversionStatus.VALIDATED
      ).length;

      // Top affiliates by revenue
      const affiliateRevenue = new Map<string, {
        affiliate: AffiliateProfile;
        revenue: number;
        conversions: number;
        commissions: number;
      }>();

      filteredCommissions.forEach((commission) => {
        const affiliate = affiliates.find((a) => a.id === commission.affiliate_id);
        if (affiliate) {
          const current = affiliateRevenue.get(affiliate.id) || {
            affiliate,
            revenue: 0,
            conversions: 0,
            commissions: 0,
          };
          current.revenue += commission.final_amount;
          current.commissions += 1;
          affiliateRevenue.set(affiliate.id, current);
        }
      });

      // Add conversion counts to affiliates
      filteredConversions.forEach((conversion) => {
        const current = affiliateRevenue.get(conversion.affiliate_id);
        if (current) {
          current.conversions += 1;
        }
      });

      const topAffiliates = Array.from(affiliateRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Top programs by revenue
      const programRevenue = new Map<string, {
        program: AffiliateProgram;
        revenue: number;
        conversions: number;
        enrollments: number;
      }>();

      filteredCommissions.forEach((commission) => {
        const program = programs.find((p) => p.id === commission.program_id);
        if (program) {
          const current = programRevenue.get(program.id) || {
            program,
            revenue: 0,
            conversions: 0,
            enrollments: 0,
          };
          current.revenue += commission.final_amount;
          programRevenue.set(program.id, current);
        }
      });

      filteredConversions.forEach((conversion) => {
        const current = programRevenue.get(conversion.program_id);
        if (current) {
          current.conversions += 1;
        }
      });

      const topPrograms = Array.from(programRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Revenue by month (last 6 months)
      const monthlyRevenue = new Map<string, { revenue: number; commissions: number }>();
      const last6Months = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        last6Months.push(monthKey);
        monthlyRevenue.set(monthKey, { revenue: 0, commissions: 0 });
      }

      commissions.forEach((commission) => {
        const date = new Date(commission.created_at);
        const monthKey = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        if (monthlyRevenue.has(monthKey)) {
          const current = monthlyRevenue.get(monthKey)!;
          current.revenue += commission.final_amount;
          current.commissions += 1;
        }
      });

      const revenueByMonth = last6Months.map((month) => ({
        month,
        revenue: monthlyRevenue.get(month)?.revenue || 0,
        commissions: monthlyRevenue.get(month)?.commissions || 0,
      }));

      // Conversions by type
      const conversionsByType: Record<string, number> = {};
      filteredConversions.forEach((conversion) => {
        conversionsByType[conversion.conversion_type] =
          (conversionsByType[conversion.conversion_type] || 0) + 1;
      });

      // Commissions by status
      const commissionsByStatus = {
        pending: filteredCommissions.filter(
          (c) => c.status === CommissionStatus.PENDING
        ).length,
        approved: filteredCommissions.filter(
          (c) => c.status === CommissionStatus.APPROVED
        ).length,
        paid: filteredCommissions.filter((c) => c.status === CommissionStatus.PAID)
          .length,
        rejected: filteredCommissions.filter(
          (c) => c.status === CommissionStatus.REJECTED
        ).length,
      };

      setAnalytics({
        totalRevenue,
        totalCommissions: filteredCommissions.length,
        totalPayouts: payoutStats.count_paid,
        totalConversions: filteredConversions.length,
        averageCommission,
        overallConversionRate: validatedConversions > 0 ? (validatedConversions / filteredConversions.length) * 100 : 0,
        topAffiliates,
        topPrograms,
        revenueByMonth,
        conversionsByType,
        commissionsByStatus,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const exportToCSV = () => {
    // Create CSV data
    let csv = "Affiliate Analytics Report\n\n";
    csv += `Generated: ${new Date().toLocaleString()}\n`;
    csv += `Timeframe: ${timeframe === "all" ? "All Time" : timeframe === "month" ? "This Month" : "This Quarter"}\n\n`;

    csv += "Top Affiliates by Revenue\n";
    csv += "Affiliate Code,Company Name,Revenue,Conversions,Commissions\n";
    analytics.topAffiliates.forEach((item) => {
      csv += `${item.affiliate.affiliate_code},${item.affiliate.company_name || "N/A"},${item.revenue},${item.conversions},${item.commissions}\n`;
    });

    csv += "\nTop Programs by Revenue\n";
    csv += "Program Name,Revenue,Conversions\n";
    analytics.topPrograms.forEach((item) => {
      csv += `${item.program.name},${item.revenue},${item.conversions}\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${timeframe}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  const maxMonthlyRevenue = Math.max(...analytics.revenueByMonth.map((m) => m.revenue), 1);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600 mt-1">Comprehensive insights into program performance</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={timeframe === "all" ? "primary" : "ghost"}
              onClick={() => setTimeframe("all")}
            >
              All Time
            </Button>
            <Button
              size="sm"
              variant={timeframe === "quarter" ? "primary" : "ghost"}
              onClick={() => setTimeframe("quarter")}
            >
              This Quarter
            </Button>
            <Button
              size="sm"
              variant={timeframe === "month" ? "primary" : "ghost"}
              onClick={() => setTimeframe("month")}
            >
              This Month
            </Button>
          </div>
          <Button size="sm" variant="secondary" onClick={exportToCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(analytics.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                From {analytics.totalCommissions} commissions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Average Commission
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(analytics.averageCommission)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per conversion</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">
                Total Conversions
              </h3>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.totalConversions}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.overallConversionRate.toFixed(1)}% validation rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Payouts</h3>
              <p className="text-3xl font-bold text-purple-600">
                {analytics.totalPayouts}
              </p>
              <p className="text-xs text-gray-500 mt-1">Completed payments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend (Last 6 Months) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.revenueByMonth.map((month) => (
              <div key={month.month}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{month.month}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(month.revenue)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({month.commissions} commissions)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${(month.revenue / maxMonthlyRevenue) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Commission Status Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Commission Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-2xl font-bold text-yellow-600">
                {analytics.commissionsByStatus.pending}
              </p>
              <p className="text-sm text-gray-600 mt-1">Pending</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">
                {analytics.commissionsByStatus.approved}
              </p>
              <p className="text-sm text-gray-600 mt-1">Approved</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">
                {analytics.commissionsByStatus.paid}
              </p>
              <p className="text-sm text-gray-600 mt-1">Paid</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-2xl font-bold text-red-600">
                {analytics.commissionsByStatus.rejected}
              </p>
              <p className="text-sm text-gray-600 mt-1">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversions by Type */}
      {Object.keys(analytics.conversionsByType).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversions by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(analytics.conversionsByType).map(([type, count]) => (
                <div
                  key={type}
                  className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 mt-1 capitalize">
                    {type.replace("_", " ")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Affiliates */}
        <Card>
          <CardHeader>
            <CardTitle>Top Affiliates by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topAffiliates.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No affiliate data yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topAffiliates.map((item, index) => (
                  <div
                    key={item.affiliate.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">
                          {item.affiliate.company_name || "No company name"}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {item.affiliate.affiliate_code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(item.revenue)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.conversions} conversions • {item.commissions} commissions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Programs */}
        <Card>
          <CardHeader>
            <CardTitle>Top Programs by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topPrograms.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No program data yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topPrograms.map((item, index) => (
                  <div
                    key={item.program.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{item.program.name}</p>
                        <Badge
                          variant={
                            item.program.status === ProgramStatus.ACTIVE
                              ? "success"
                              : "default"
                          }
                        >
                          {item.program.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {formatCurrency(item.revenue)}
                      </p>
                      <p className="text-xs text-gray-500">{item.conversions} conversions</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

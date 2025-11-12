"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  Commission,
  CommissionStatus,
  CommissionStats,
} from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function AffiliateCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CommissionStatus | "all">("all");

  const fetchData = async () => {
    try {
      const params = filterStatus !== "all" ? { status: filterStatus } : {};
      const [commissionsData, statsData] = await Promise.all([
        apiClient.listCommissions(params),
        apiClient.getCommissionStats(),
      ]);
      setCommissions(commissionsData);
      setStats(statsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const getStatusBadge = (status: CommissionStatus) => {
    const variants: Record<CommissionStatus, "success" | "warning" | "danger" | "default"> = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      paid: "default",
    };
    const labels: Record<CommissionStatus, string> = {
      pending: "Pending Approval",
      approved: "Approved",
      rejected: "Rejected",
      paid: "Paid",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return <div className="p-6">Loading commissions...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">My Commissions</h2>
        <p className="text-gray-600 mt-1">Track your earnings and commission status</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {formatCurrency(stats.total_pending)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.count_pending} commissions
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-1">Approved (Unpaid)</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats.total_approved)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.count_approved} commissions
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats.total_paid)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.count_paid} commissions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2">
        <Button
          size="sm"
          variant={filterStatus === "all" ? "primary" : "ghost"}
          onClick={() => setFilterStatus("all")}
        >
          All
        </Button>
        <Button
          size="sm"
          variant={filterStatus === CommissionStatus.PENDING ? "primary" : "ghost"}
          onClick={() => setFilterStatus(CommissionStatus.PENDING)}
        >
          Pending
        </Button>
        <Button
          size="sm"
          variant={filterStatus === CommissionStatus.APPROVED ? "primary" : "ghost"}
          onClick={() => setFilterStatus(CommissionStatus.APPROVED)}
        >
          Approved
        </Button>
        <Button
          size="sm"
          variant={filterStatus === CommissionStatus.PAID ? "primary" : "ghost"}
          onClick={() => setFilterStatus(CommissionStatus.PAID)}
        >
          Paid
        </Button>
      </div>

      {/* Commissions List */}
      {commissions.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              No commissions found. Start promoting to earn commissions!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {commissions.map((commission) => (
            <Card key={commission.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Commission {commission.id.substring(0, 8)}...
                      </h3>
                      {getStatusBadge(commission.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Base Amount:</span>{" "}
                        <span className="font-medium">
                          {formatCurrency(commission.base_amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Multiplier:</span>{" "}
                        <span className="font-medium">
                          {commission.tier_multiplier}x
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Final Amount:</span>{" "}
                        <span className="font-bold text-green-600">
                          {formatCurrency(commission.final_amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>{" "}
                        <span className="font-medium">
                          {new Date(commission.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {commission.approved_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Approved on {new Date(commission.approved_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedCommission(commission);
                        setShowDetailsModal(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Commission Details"
        size="lg"
      >
        {selectedCommission && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Commission ID</p>
                <p className="text-sm font-mono">{selectedCommission.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                {getStatusBadge(selectedCommission.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion ID</p>
                <p className="text-sm font-mono">{selectedCommission.conversion_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Program ID</p>
                <p className="text-sm font-mono">{selectedCommission.program_id}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Commission Breakdown
              </h4>
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Base Commission:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(selectedCommission.base_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tier Multiplier:</span>
                  <span className="text-sm font-medium">
                    {selectedCommission.tier_multiplier}x
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
                  <span className="text-sm font-medium text-gray-900">Your Earnings:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedCommission.final_amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Created At</p>
                  <p className="font-medium">
                    {new Date(selectedCommission.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedCommission.approved_at && (
                  <div>
                    <p className="text-gray-600 mb-1">Approved At</p>
                    <p className="font-medium">
                      {new Date(selectedCommission.approved_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedCommission.status === CommissionStatus.PENDING && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  This commission is pending approval. It will be available for payout
                  once approved by an administrator.
                </p>
              </div>
            )}

            {selectedCommission.status === CommissionStatus.APPROVED && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800">
                  This commission has been approved and will be included in your next payout.
                </p>
              </div>
            )}

            {selectedCommission.status === CommissionStatus.PAID && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <p className="text-sm text-gray-800">
                  This commission has been paid{" "}
                  {selectedCommission.payout_id && `via payout ${selectedCommission.payout_id.substring(0, 8)}...`}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

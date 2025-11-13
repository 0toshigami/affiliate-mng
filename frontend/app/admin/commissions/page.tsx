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

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [stats, setStats] = useState<CommissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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

  const handleApprove = async (commissionId: string) => {
    setActionLoading(true);
    try {
      await apiClient.approveCommission(commissionId);
      await fetchData();
      setShowDetailsModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (commissionId: string) => {
    setActionLoading(true);
    try {
      await apiClient.rejectCommission(commissionId);
      await fetchData();
      setShowDetailsModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: CommissionStatus) => {
    const variants: Record<CommissionStatus, "success" | "warning" | "danger" | "default"> = {
      pending: "warning",
      approved: "success",
      rejected: "danger",
      paid: "default",
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
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
        <h2 className="text-3xl font-bold text-gray-900">Commission Management</h2>
        <p className="text-gray-600 mt-1">Review and approve affiliate commissions</p>
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
      <Card>
        <CardHeader>
          <CardTitle>Commissions</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No commissions found for the selected filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Affiliate ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Multiplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {commission.affiliate_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(commission.base_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {commission.tier_multiplier}x
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(commission.final_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(commission.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCommission(commission);
                              setShowDetailsModal(true);
                            }}
                          >
                            View
                          </Button>
                          {commission.status === CommissionStatus.PENDING && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleApprove(commission.id)}
                                disabled={actionLoading}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleReject(commission.id)}
                                disabled={actionLoading}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
                <p className="text-sm text-gray-600">Affiliate ID</p>
                <p className="text-sm font-mono">{selectedCommission.affiliate_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Program ID</p>
                <p className="text-sm font-mono">{selectedCommission.program_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversion ID</p>
                <p className="text-sm font-mono">{selectedCommission.conversion_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tier ID</p>
                <p className="text-sm font-mono">{selectedCommission.tier_id || "N/A"}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Commission Calculation
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Base Amount:</span>
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
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-gray-900">Final Amount:</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(selectedCommission.final_amount)}
                  </span>
                </div>
              </div>
            </div>

            {selectedCommission.approved_at && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Approved At</p>
                <p className="text-sm font-medium">
                  {new Date(selectedCommission.approved_at).toLocaleString()}
                </p>
              </div>
            )}

            {selectedCommission.status === CommissionStatus.PENDING && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleApprove(selectedCommission.id)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? "Processing..." : "Approve Commission"}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleReject(selectedCommission.id)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? "Processing..." : "Reject Commission"}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  Payout,
  PayoutStatus,
  PayoutStats,
  AffiliateProfile,
  ApprovalStatus,
} from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<PayoutStatus | "all">("all");
  const [formData, setFormData] = useState({
    affiliate_id: "",
    start_date: "",
    end_date: "",
    payment_reference: "",
  });

  const fetchData = async () => {
    try {
      const params = filterStatus !== "all" ? { status: filterStatus } : {};
      const [payoutsData, statsData] = await Promise.all([
        apiClient.listPayouts(params),
        apiClient.getPayoutStats(),
      ]);
      setPayouts(payoutsData);
      setStats(statsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAffiliates = async () => {
    try {
      const affiliatesData = await apiClient.listAffiliates({ status: ApprovalStatus.APPROVED });
      setAffiliates(affiliatesData);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchData();
    fetchAffiliates();
  }, [filterStatus]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      await apiClient.generatePayout({
        affiliate_id: formData.affiliate_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });

      await fetchData();
      setShowGenerateModal(false);
      setFormData({
        affiliate_id: "",
        start_date: "",
        end_date: "",
        payment_reference: "",
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    setActionLoading(true);
    try {
      await apiClient.processPayout(selectedPayout.id, formData.payment_reference);
      await fetchData();
      setShowProcessModal(false);
      setFormData({ ...formData, payment_reference: "" });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (payoutId: string) => {
    if (!confirm("Are you sure you want to cancel this payout?")) return;

    setActionLoading(true);
    try {
      await apiClient.cancelPayout(payoutId);
      await fetchData();
      setShowDetailsModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: PayoutStatus) => {
    const variants: Record<PayoutStatus, "success" | "warning" | "default" | "danger"> = {
      pending: "warning",
      processing: "default",
      paid: "success",
      cancelled: "danger",
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
    return <div className="p-6">Loading payouts...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Payout Management</h2>
          <p className="text-gray-600 mt-1">Generate and process affiliate payouts</p>
        </div>
        <Button onClick={() => setShowGenerateModal(true)}>Generate Payout</Button>
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
                <p className="text-sm text-gray-600 mb-1">Pending Payouts</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {formatCurrency(stats.total_pending)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.count_pending} payouts
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-1">Processing</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(stats.total_processing)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.count_processing} payouts
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(stats.total_paid)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.count_paid} payouts
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
          variant={filterStatus === PayoutStatus.PENDING ? "primary" : "ghost"}
          onClick={() => setFilterStatus(PayoutStatus.PENDING)}
        >
          Pending
        </Button>
        <Button
          size="sm"
          variant={filterStatus === PayoutStatus.PROCESSING ? "primary" : "ghost"}
          onClick={() => setFilterStatus(PayoutStatus.PROCESSING)}
        >
          Processing
        </Button>
        <Button
          size="sm"
          variant={filterStatus === PayoutStatus.PAID ? "primary" : "ghost"}
          onClick={() => setFilterStatus(PayoutStatus.PAID)}
        >
          Paid
        </Button>
      </div>

      {/* Payouts List */}
      <Card>
        <CardHeader>
          <CardTitle>Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No payouts found for the selected filter.
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
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {payout.affiliate_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {formatCurrency(payout.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payout.commissions_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payout.start_date).toLocaleDateString()} -{" "}
                        {new Date(payout.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payout.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowDetailsModal(true);
                            }}
                          >
                            View
                          </Button>
                          {(payout.status === PayoutStatus.PENDING ||
                            payout.status === PayoutStatus.PROCESSING) && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setSelectedPayout(payout);
                                setShowProcessModal(true);
                              }}
                              disabled={actionLoading}
                            >
                              Process
                            </Button>
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

      {/* Generate Payout Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Generate New Payout"
        size="lg"
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Affiliate *
            </label>
            <select
              value={formData.affiliate_id}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, affiliate_id: e.target.value }))
              }
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Choose an affiliate...</option>
              {affiliates.map((affiliate) => (
                <option key={affiliate.id} value={affiliate.id}>
                  {affiliate.affiliate_code} - {affiliate.company_name || "No Company"}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Start Date *"
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, start_date: e.target.value }))
            }
            required
          />

          <Input
            label="End Date *"
            type="date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, end_date: e.target.value }))
            }
            required
          />

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              This will collect all approved, unpaid commissions for the selected
              affiliate within the specified date range.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={actionLoading} className="flex-1">
              {actionLoading ? "Generating..." : "Generate Payout"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowGenerateModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Process Payout Modal */}
      <Modal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title="Process Payout"
        size="lg"
      >
        {selectedPayout && (
          <form onSubmit={handleProcess} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Payout ID:</span>
                <span className="text-sm font-mono">{selectedPayout.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(selectedPayout.total_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Commissions:</span>
                <span className="text-sm font-medium">{selectedPayout.commissions_count}</span>
              </div>
            </div>

            <Input
              label="Payment Reference *"
              value={formData.payment_reference}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, payment_reference: e.target.value }))
              }
              required
              placeholder="Transaction ID, check number, etc."
            />

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                This action will mark the payout as paid and update all associated
                commissions to the paid status. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={actionLoading} className="flex-1">
                {actionLoading ? "Processing..." : "Mark as Paid"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowProcessModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Payout Details"
        size="lg"
      >
        {selectedPayout && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Payout ID</p>
                <p className="text-sm font-mono">{selectedPayout.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                {getStatusBadge(selectedPayout.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Affiliate ID</p>
                <p className="text-sm font-mono">{selectedPayout.affiliate_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(selectedPayout.total_amount)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Period</h4>
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-gray-600">Start Date</p>
                  <p className="font-medium">
                    {new Date(selectedPayout.start_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">End Date</p>
                  <p className="font-medium">
                    {new Date(selectedPayout.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-1">Commissions Count</p>
              <p className="text-2xl font-bold">{selectedPayout.commissions_count}</p>
            </div>

            {selectedPayout.payment_reference && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Payment Reference</p>
                <p className="text-sm font-medium">{selectedPayout.payment_reference}</p>
              </div>
            )}

            {selectedPayout.processed_at && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Processed At</p>
                <p className="text-sm font-medium">
                  {new Date(selectedPayout.processed_at).toLocaleString()}
                </p>
              </div>
            )}

            {(selectedPayout.status === PayoutStatus.PENDING ||
              selectedPayout.status === PayoutStatus.PROCESSING) && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowProcessModal(true);
                  }}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  Process Payout
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleCancel(selectedPayout.id)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  Cancel Payout
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

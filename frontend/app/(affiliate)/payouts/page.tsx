"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import { Payout, PayoutStatus, PayoutStats } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function AffiliatePayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<PayoutStatus | "all">("all");

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

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const getStatusBadge = (status: PayoutStatus) => {
    const variants: Record<PayoutStatus, "success" | "warning" | "default" | "danger"> = {
      pending: "warning",
      processing: "default",
      paid: "success",
      cancelled: "danger",
    };
    const labels: Record<PayoutStatus, string> = {
      pending: "Pending",
      processing: "Processing",
      paid: "Paid",
      cancelled: "Cancelled",
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
    return <div className="p-6">Loading payouts...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Payouts</h2>
        <p className="text-gray-600 mt-1">View your payout history</p>
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
                <p className="text-sm text-gray-600 mb-1">Pending</p>
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
                <p className="text-sm text-gray-600 mb-1">Total Received</p>
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
      {payouts.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              No payouts yet. Keep earning commissions to receive payouts!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payouts.map((payout) => (
            <Card key={payout.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Payout {payout.id.substring(0, 8)}...
                      </h3>
                      {getStatusBadge(payout.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Amount:</span>{" "}
                        <span className="font-bold text-green-600">
                          {formatCurrency(payout.total_amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Commissions:</span>{" "}
                        <span className="font-medium">{payout.commissions_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Period:</span>{" "}
                        <span className="font-medium">
                          {new Date(payout.start_date).toLocaleDateString()} -{" "}
                          {new Date(payout.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>{" "}
                        <span className="font-medium">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {payout.processed_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Paid on {new Date(payout.processed_at).toLocaleDateString()}
                        {payout.payment_reference && ` - Ref: ${payout.payment_reference}`}
                      </p>
                    )}
                  </div>

                  <div className="ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedPayout(payout);
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
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Amount</h4>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(selectedPayout.total_amount)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Period Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Start Date</p>
                  <p className="font-medium">
                    {new Date(selectedPayout.start_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">End Date</p>
                  <p className="font-medium">
                    {new Date(selectedPayout.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-1">Total Commissions Included</p>
              <p className="text-2xl font-bold">{selectedPayout.commissions_count}</p>
            </div>

            {selectedPayout.payment_method && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                <p className="text-sm font-medium">{selectedPayout.payment_method}</p>
              </div>
            )}

            {selectedPayout.payment_reference && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Payment Reference</p>
                <p className="text-sm font-medium">{selectedPayout.payment_reference}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Created At</p>
                  <p className="font-medium">
                    {new Date(selectedPayout.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedPayout.processed_at && (
                  <div>
                    <p className="text-gray-600 mb-1">Paid At</p>
                    <p className="font-medium">
                      {new Date(selectedPayout.processed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedPayout.status === PayoutStatus.PENDING && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  This payout is pending. It will be processed soon.
                </p>
              </div>
            )}

            {selectedPayout.status === PayoutStatus.PROCESSING && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  This payout is being processed. You'll receive payment shortly.
                </p>
              </div>
            )}

            {selectedPayout.status === PayoutStatus.PAID && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800">
                  This payout has been completed and sent to you.
                </p>
              </div>
            )}

            {selectedPayout.status === PayoutStatus.CANCELLED && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">
                  This payout has been cancelled. Your commissions have been returned to
                  the approved state and will be included in future payouts.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

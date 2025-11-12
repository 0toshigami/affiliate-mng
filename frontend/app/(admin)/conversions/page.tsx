"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  Conversion,
  ConversionStatus,
  ConversionType,
} from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function AdminConversionsPage() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedConversion, setSelectedConversion] = useState<Conversion | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ConversionStatus | "all">("all");

  const fetchConversions = async () => {
    try {
      const params = filterStatus !== "all" ? { status: filterStatus } : {};
      const data = await apiClient.listConversions(params);
      setConversions(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversions();
  }, [filterStatus]);

  const handleValidate = async (conversionId: string) => {
    setActionLoading(true);
    try {
      await apiClient.validateConversion(conversionId);
      await fetchConversions();
      setShowDetailsModal(false);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (conversionId: string) => {
    if (!confirm("Are you sure you want to reject this conversion?")) return;

    setActionLoading(true);
    try {
      await apiClient.rejectConversion(conversionId);
      await fetchConversions();
      setShowDetailsModal(false);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: ConversionStatus) => {
    const variants: Record<ConversionStatus, "success" | "warning" | "danger"> = {
      pending: "warning",
      validated: "success",
      rejected: "danger",
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getTypeBadge = (type: ConversionType) => {
    const labels: Record<ConversionType, string> = {
      signup: "Sign Up",
      trial_start: "Trial Start",
      subscription: "Subscription",
      purchase: "Purchase",
      lead: "Lead",
    };
    return <Badge variant="default">{labels[type]}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const pendingCount = conversions.filter(c => c.status === ConversionStatus.PENDING).length;
  const validatedCount = conversions.filter(c => c.status === ConversionStatus.VALIDATED).length;
  const rejectedCount = conversions.filter(c => c.status === ConversionStatus.REJECTED).length;

  if (isLoading) {
    return <div className="p-6">Loading conversions...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Conversion Management</h2>
        <p className="text-gray-600 mt-1">Review and validate affiliate conversions</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-1">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-xs text-gray-500 mt-1">conversions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-1">Validated</p>
              <p className="text-3xl font-bold text-green-600">{validatedCount}</p>
              <p className="text-xs text-gray-500 mt-1">conversions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              <p className="text-xs text-gray-500 mt-1">conversions</p>
            </div>
          </CardContent>
        </Card>
      </div>

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
          variant={filterStatus === ConversionStatus.PENDING ? "primary" : "ghost"}
          onClick={() => setFilterStatus(ConversionStatus.PENDING)}
        >
          Pending ({pendingCount})
        </Button>
        <Button
          size="sm"
          variant={filterStatus === ConversionStatus.VALIDATED ? "primary" : "ghost"}
          onClick={() => setFilterStatus(ConversionStatus.VALIDATED)}
        >
          Validated
        </Button>
        <Button
          size="sm"
          variant={filterStatus === ConversionStatus.REJECTED ? "primary" : "ghost"}
          onClick={() => setFilterStatus(ConversionStatus.REJECTED)}
        >
          Rejected
        </Button>
      </div>

      {/* Conversions List */}
      <Card>
        <CardHeader>
          <CardTitle>Conversions</CardTitle>
        </CardHeader>
        <CardContent>
          {conversions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No conversions found for the selected filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Affiliate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
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
                  {conversions.map((conversion) => (
                    <tr key={conversion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(conversion.conversion_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {conversion.affiliate_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(conversion.conversion_value)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(conversion.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(conversion.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedConversion(conversion);
                              setShowDetailsModal(true);
                            }}
                          >
                            View
                          </Button>
                          {conversion.status === ConversionStatus.PENDING && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleValidate(conversion.id)}
                                disabled={actionLoading}
                              >
                                Validate
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleReject(conversion.id)}
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
        title="Conversion Details"
        size="lg"
      >
        {selectedConversion && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Conversion ID</p>
                <p className="text-sm font-mono">{selectedConversion.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                {getStatusBadge(selectedConversion.status)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Type</p>
                {getTypeBadge(selectedConversion.conversion_type)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Value</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(selectedConversion.conversion_value)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Tracking Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Affiliate ID</p>
                  <p className="font-mono">{selectedConversion.affiliate_id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Program ID</p>
                  <p className="font-mono">{selectedConversion.program_id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Referral Link ID</p>
                  <p className="font-mono">{selectedConversion.referral_link_id}</p>
                </div>
                <div>
                  <p className="text-gray-600">Visitor Session</p>
                  <p className="font-mono text-xs">{selectedConversion.visitor_session_id}</p>
                </div>
                {selectedConversion.customer_id && (
                  <div>
                    <p className="text-gray-600">Customer ID</p>
                    <p className="font-mono">{selectedConversion.customer_id}</p>
                  </div>
                )}
              </div>
            </div>

            {selectedConversion.metadata && Object.keys(selectedConversion.metadata).length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Metadata</h4>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                  {JSON.stringify(selectedConversion.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Created At</p>
                  <p className="font-medium">
                    {new Date(selectedConversion.created_at).toLocaleString()}
                  </p>
                </div>
                {selectedConversion.validated_at && (
                  <div>
                    <p className="text-gray-600 mb-1">Validated At</p>
                    <p className="font-medium">
                      {new Date(selectedConversion.validated_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedConversion.rejected_at && (
                  <div>
                    <p className="text-gray-600 mb-1">Rejected At</p>
                    <p className="font-medium">
                      {new Date(selectedConversion.rejected_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedConversion.status === ConversionStatus.PENDING && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleValidate(selectedConversion.id)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? "Processing..." : "Validate & Create Commission"}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleReject(selectedConversion.id)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? "Processing..." : "Reject Conversion"}
                </Button>
              </div>
            )}

            {selectedConversion.status === ConversionStatus.VALIDATED && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800">
                  This conversion has been validated and a commission has been created.
                </p>
              </div>
            )}

            {selectedConversion.status === ConversionStatus.REJECTED && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">
                  This conversion has been rejected and no commission was created.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

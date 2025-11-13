"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import { AffiliateProfile, ApprovalStatus } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";

export default function AffiliatesListPage() {
  const [affiliates, setAffiliates] = useState<AffiliateProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateProfile | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAffiliates = async () => {
    try {
      const data = await apiClient.listAffiliates();
      setAffiliates(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleApprove = async () => {
    if (!selectedAffiliate) return;

    setActionLoading(true);
    try {
      await apiClient.approveAffiliate(selectedAffiliate.id);
      await fetchAffiliates();
      setShowApproveModal(false);
      setSelectedAffiliate(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAffiliate || !rejectionReason.trim()) return;

    setActionLoading(true);
    try {
      await apiClient.rejectAffiliate(selectedAffiliate.id, rejectionReason);
      await fetchAffiliates();
      setShowRejectModal(false);
      setSelectedAffiliate(null);
      setRejectionReason("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    const variants: Record<ApprovalStatus, "success" | "warning" | "danger"> = {
      [ApprovalStatus.APPROVED]: "success",
      [ApprovalStatus.PENDING]: "warning",
      [ApprovalStatus.REJECTED]: "danger",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6">Loading affiliates...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Affiliates</h2>
        <p className="text-gray-600 mt-1">Manage affiliate applications and profiles</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Affiliate Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Website
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
                {affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No affiliates found
                    </td>
                  </tr>
                ) : (
                  affiliates.map((affiliate) => (
                    <tr key={affiliate.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {affiliate.affiliate_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {affiliate.company_name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {affiliate.website_url ? (
                          <a
                            href={affiliate.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Visit
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(affiliate.approval_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(affiliate.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {affiliate.approval_status === ApprovalStatus.PENDING && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAffiliate(affiliate);
                                setShowApproveModal(true);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setSelectedAffiliate(affiliate);
                                setShowRejectModal(true);
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {affiliate.approval_status === ApprovalStatus.REJECTED &&
                          affiliate.rejection_reason && (
                            <span className="text-xs text-gray-500">
                              {affiliate.rejection_reason}
                            </span>
                          )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Affiliate"
      >
        <p className="mb-4">
          Are you sure you want to approve{" "}
          <strong>{selectedAffiliate?.affiliate_code}</strong>?
        </p>
        <p className="text-sm text-gray-600 mb-6">
          The affiliate will be assigned to the default Bronze tier and can start
          enrolling in programs.
        </p>
        <div className="flex gap-3">
          <Button onClick={handleApprove} disabled={actionLoading} className="flex-1">
            {actionLoading ? "Approving..." : "Approve"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowApproveModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Affiliate"
      >
        <p className="mb-4">
          Provide a reason for rejecting{" "}
          <strong>{selectedAffiliate?.affiliate_code}</strong>:
        </p>
        <Textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={4}
          className="mb-6"
        />
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={handleReject}
            disabled={actionLoading || !rejectionReason.trim()}
            className="flex-1"
          >
            {actionLoading ? "Rejecting..." : "Reject"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowRejectModal(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

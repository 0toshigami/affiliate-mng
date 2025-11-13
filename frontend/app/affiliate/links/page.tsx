"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import {
  ReferralLink,
  ReferralLinkWithUrl,
  ProgramEnrollment,
  ReferralLinkStats,
  EnrollmentStatus,
} from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";

export default function ReferralLinksPage() {
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ReferralLink | null>(null);
  const [stats, setStats] = useState<ReferralLinkStats | null>(null);
  const [formData, setFormData] = useState({
    program_id: "",
    target_url: "",
    utm_source: "affiliate",
    utm_medium: "referral",
    utm_campaign: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [linksData, enrollmentsData] = await Promise.all([
        apiClient.listMyReferralLinks(),
        apiClient.getMyEnrollments(),
      ]);
      setLinks(linksData);
      setEnrollments(enrollmentsData.filter((e) => e.status === EnrollmentStatus.ACTIVE));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const utm_params: Record<string, string> = {
        utm_source: formData.utm_source,
        utm_medium: formData.utm_medium,
      };
      if (formData.utm_campaign) {
        utm_params.utm_campaign = formData.utm_campaign;
      }

      await apiClient.createReferralLink({
        program_id: formData.program_id,
        target_url: formData.target_url,
        utm_params,
      });

      await fetchData();
      setShowCreateModal(false);
      setFormData({
        program_id: "",
        target_url: "",
        utm_source: "affiliate",
        utm_medium: "referral",
        utm_campaign: "",
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewStats = async (link: ReferralLink) => {
    setSelectedLink(link);
    setShowStatsModal(true);
    try {
      const statsData = await apiClient.getReferralLinkStats(link.id);
      setStats(statsData);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const copyToClipboard = async (link: ReferralLink) => {
    // Build full URL
    const fullUrl = `${window.location.origin}/api/v1/referrals/track/${link.link_code}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      setError("Failed to copy to clipboard");
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading referral links...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Referral Links</h2>
          <p className="text-gray-600 mt-1">
            Generate and manage your referral links
          </p>
        </div>
        {enrollments.length > 0 && (
          <Button onClick={() => setShowCreateModal(true)}>
            Generate Link
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {enrollments.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              You need to enroll in a program first before creating referral links.
            </p>
            <div className="text-center">
              <Button onClick={() => (window.location.href = "/affiliate/programs")}>
                Browse Programs
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : links.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              No referral links yet. Create your first link to start earning!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {links.map((link) => (
            <Card key={link.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {link.link_code}
                      </h3>
                      <Badge
                        variant={link.status === "active" ? "success" : "default"}
                      >
                        {link.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      Target: {link.target_url}
                    </p>

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Clicks:</span>{" "}
                        <span className="font-medium">{link.clicks_count}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Conversions:</span>{" "}
                        <span className="font-medium">
                          {link.conversions_count}
                        </span>
                      </div>
                      {link.clicks_count > 0 && (
                        <div>
                          <span className="text-gray-600">Rate:</span>{" "}
                          <span className="font-medium">
                            {(
                              (link.conversions_count / link.clicks_count) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyToClipboard(link)}
                    >
                      {copiedId === link.id ? "Copied!" : "Copy Link"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewStats(link)}
                    >
                      View Stats
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Link Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Generate Referral Link"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Program *
            </label>
            <select
              value={formData.program_id}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, program_id: e.target.value }))
              }
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Choose a program...</option>
              {enrollments.map((enrollment) => (
                <option key={enrollment.id} value={enrollment.program_id}>
                  Program {enrollment.program_id}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Target URL *"
            value={formData.target_url}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, target_url: e.target.value }))
            }
            required
            placeholder="https://yourproduct.com/signup"
          />

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              UTM Parameters
            </h4>

            <div className="space-y-3">
              <Input
                label="UTM Source"
                value={formData.utm_source}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, utm_source: e.target.value }))
                }
                placeholder="affiliate"
              />

              <Input
                label="UTM Medium"
                value={formData.utm_medium}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, utm_medium: e.target.value }))
                }
                placeholder="referral"
              />

              <Input
                label="UTM Campaign (Optional)"
                value={formData.utm_campaign}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    utm_campaign: e.target.value,
                  }))
                }
                placeholder="spring2024"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={actionLoading} className="flex-1">
              {actionLoading ? "Creating..." : "Generate Link"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stats Modal */}
      <Modal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        title="Link Statistics"
      >
        {stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_clicks}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Unique Visitors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.unique_visitors}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Conversions</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.conversions}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.conversion_rate}%
                </p>
              </div>
            </div>

            {stats.last_click_at && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Last Click</p>
                <p className="text-sm font-medium">
                  {new Date(stats.last_click_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center py-4">Loading statistics...</p>
        )}
      </Modal>
    </div>
  );
}

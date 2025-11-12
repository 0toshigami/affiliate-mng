"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultCommissionRate: number;
  defaultCommissionType: "percentage" | "fixed";
  minimumPayoutAmount: number;
  payoutSchedule: string;
  autoApproveAffiliates: boolean;
  autoValidateConversions: boolean;
  requireEmailVerification: boolean;
}

interface AffiliateTier {
  id: string;
  name: string;
  multiplier: number;
  requirements: {
    minConversions?: number;
    minRevenue?: number;
  };
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "tiers" | "notifications" | "advanced">("general");
  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: "Affiliate Management System",
    supportEmail: "support@example.com",
    defaultCommissionRate: 10,
    defaultCommissionType: "percentage",
    minimumPayoutAmount: 50,
    payoutSchedule: "monthly",
    autoApproveAffiliates: false,
    autoValidateConversions: false,
    requireEmailVerification: true,
  });

  const [tiers] = useState<AffiliateTier[]>([
    {
      id: "1",
      name: "Bronze",
      multiplier: 1.0,
      requirements: {},
    },
    {
      id: "2",
      name: "Silver",
      multiplier: 1.2,
      requirements: {
        minConversions: 10,
        minRevenue: 1000,
      },
    },
    {
      id: "3",
      name: "Gold",
      multiplier: 1.5,
      requirements: {
        minConversions: 50,
        minRevenue: 5000,
      },
    },
    {
      id: "4",
      name: "Platinum",
      multiplier: 2.0,
      requirements: {
        minConversions: 100,
        minRevenue: 10000,
      },
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Platform Settings</h2>
        <p className="text-gray-600 mt-1">Configure your affiliate program settings</p>
      </div>

      {saveMessage && (
        <div
          className={`mb-4 p-4 rounded-md ${
            saveMessage.includes("Error")
              ? "bg-red-50 border border-red-200"
              : "bg-green-50 border border-green-200"
          }`}
        >
          <p
            className={`text-sm ${
              saveMessage.includes("Error") ? "text-red-800" : "text-green-800"
            }`}
          >
            {saveMessage}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "general"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab("tiers")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "tiers"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Affiliate Tiers
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "notifications"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab("advanced")}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === "advanced"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Advanced
        </button>
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Platform Name"
                  value={settings.platformName}
                  onChange={(e) =>
                    setSettings({ ...settings, platformName: e.target.value })
                  }
                />
                <Input
                  label="Support Email"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, supportEmail: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default Commission Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Type
                  </label>
                  <select
                    value={settings.defaultCommissionType}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultCommissionType: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <Input
                  label={
                    settings.defaultCommissionType === "percentage"
                      ? "Default Commission Rate (%)"
                      : "Default Commission Amount ($)"
                  }
                  type="number"
                  value={settings.defaultCommissionRate}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultCommissionRate: parseFloat(e.target.value),
                    })
                  }
                />

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    This default will be used when creating new programs. You can override
                    it on a per-program basis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Minimum Payout Amount ($)"
                  type="number"
                  value={settings.minimumPayoutAmount}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      minimumPayoutAmount: parseFloat(e.target.value),
                    })
                  }
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Schedule
                  </label>
                  <select
                    value={settings.payoutSchedule}
                    onChange={(e) =>
                      setSettings({ ...settings, payoutSchedule: e.target.value })
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Affiliates will only receive payouts when their approved commissions
                    reach the minimum amount.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Affiliate Tiers */}
      {activeTab === "tiers" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Affiliate Tiers</CardTitle>
                <Button size="sm" disabled>
                  Add New Tier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
                        <Badge variant="default">{tier.multiplier}x multiplier</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" disabled>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" disabled>
                          Delete
                        </Button>
                      </div>
                    </div>

                    {Object.keys(tier.requirements).length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Requirements:</p>
                        <div className="flex gap-4 text-sm">
                          {tier.requirements.minConversions && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Min Conversions:</span>
                              <span className="font-semibold">
                                {tier.requirements.minConversions}
                              </span>
                            </div>
                          )}
                          {tier.requirements.minRevenue && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Min Revenue:</span>
                              <span className="font-semibold">
                                {formatCurrency(tier.requirements.minRevenue)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Default tier - No requirements</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Tiers are automatically assigned based on affiliate performance. Higher tiers
                  receive commission multipliers that boost their earnings.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">New Affiliate Applications</p>
                    <p className="text-sm text-gray-600">
                      Notify admins when new affiliates apply
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => {}}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Commission Approval</p>
                    <p className="text-sm text-gray-600">
                      Notify affiliates when commissions are approved
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => {}}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Payout Processed</p>
                    <p className="text-sm text-gray-600">
                      Notify affiliates when payouts are completed
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => {}}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">New Conversions</p>
                    <p className="text-sm text-gray-600">
                      Notify admins when new conversions need validation
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => {}}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Weekly Summary</p>
                    <p className="text-sm text-gray-600">
                      Send weekly performance summary to affiliates
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => {}}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Email notifications require proper SMTP configuration
                  in your environment variables. Contact support if you need assistance.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Notification Settings"}
            </Button>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      {activeTab === "advanced" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Auto-approve Affiliates</p>
                    <p className="text-sm text-gray-600">
                      Automatically approve new affiliate applications
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoApproveAffiliates}
                    onChange={(e) =>
                      setSettings({ ...settings, autoApproveAffiliates: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Auto-validate Conversions</p>
                    <p className="text-sm text-gray-600">
                      Automatically validate conversions without manual review
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoValidateConversions}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoValidateConversions: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Require Email Verification</p>
                    <p className="text-sm text-gray-600">
                      Users must verify their email before accessing the platform
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireEmailVerification}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        requireEmailVerification: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> Auto-approval features should only be enabled if
                    you have proper fraud detection mechanisms in place.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">API Base URL</p>
                  <code className="text-sm text-gray-600 bg-white px-3 py-2 rounded border border-gray-200 block">
                    {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
                  </code>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">API Documentation</p>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/docs`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Swagger Documentation →
                  </a>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    API keys and webhooks configuration can be managed through environment
                    variables. See documentation for more details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Advanced Settings"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

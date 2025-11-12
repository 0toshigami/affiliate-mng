"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, getErrorMessage } from "@/lib/api";
import { AffiliateProfile, ApprovalStatus } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AffiliateProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    company_name: "",
    website_url: "",
    twitter: "",
    linkedin: "",
    facebook: "",
  });

  const fetchProfile = async () => {
    try {
      const data = await apiClient.getMyAffiliateProfile();
      setProfile(data);
      setFormData({
        company_name: data.company_name || "",
        website_url: data.website_url || "",
        twitter: data.social_media?.twitter || "",
        linkedin: data.social_media?.linkedin || "",
        facebook: data.social_media?.facebook || "",
      });
    } catch (err) {
      const message = getErrorMessage(err);
      if (message.includes("not found")) {
        // No profile yet, redirect to apply page
        router.push("/affiliate/apply");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const social_media: Record<string, string> = {};
      if (formData.twitter) social_media.twitter = formData.twitter;
      if (formData.linkedin) social_media.linkedin = formData.linkedin;
      if (formData.facebook) social_media.facebook = formData.facebook;

      await apiClient.updateMyAffiliateProfile({
        company_name: formData.company_name,
        website_url: formData.website_url || undefined,
        social_media,
      });

      await fetchProfile();
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    const variants: Record<ApprovalStatus, "success" | "warning" | "danger"> = {
      approved: "success",
      pending: "warning",
      rejected: "danger",
    };
    const labels: Record<ApprovalStatus, string> = {
      approved: "Approved",
      pending: "Pending Approval",
      rejected: "Rejected",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (isLoading && !profile) {
    return <div className="p-6">Loading profile...</div>;
  }

  if (!profile) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Affiliate Profile</h2>
        <p className="text-gray-600 mt-1">Manage your affiliate information</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Approval Status</p>
              {getStatusBadge(profile.approval_status)}
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Affiliate Code</p>
              <p className="text-lg font-mono font-bold text-gray-900">
                {profile.affiliate_code}
              </p>
            </div>

            {profile.rejection_reason && (
              <div className="mt-4 p-3 bg-red-50 rounded-md">
                <p className="text-sm font-medium text-red-800 mb-1">
                  Rejection Reason:
                </p>
                <p className="text-sm text-red-600">{profile.rejection_reason}</p>
              </div>
            )}

            {profile.approval_status === ApprovalStatus.PENDING && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-800">
                  Your application is under review. You'll be notified once it's
                  approved.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Details</CardTitle>
              {!isEditing && profile.approval_status !== ApprovalStatus.REJECTED && (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <Input
                  label="Company Name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Your Company or Personal Brand"
                />

                <Input
                  label="Website URL"
                  name="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                />

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Social Media
                  </h4>
                  <div className="space-y-3">
                    <Input
                      label="Twitter"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleChange}
                      placeholder="@yourusername"
                    />

                    <Input
                      label="LinkedIn"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleChange}
                      placeholder="linkedin.com/in/yourprofile"
                    />

                    <Input
                      label="Facebook"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleChange}
                      placeholder="facebook.com/yourpage"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Company Name</p>
                  <p className="font-medium">{profile.company_name || "-"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  {profile.website_url ? (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {profile.website_url}
                    </a>
                  ) : (
                    <p className="text-gray-400">-</p>
                  )}
                </div>

                {profile.social_media &&
                  Object.keys(profile.social_media).length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Social Media</p>
                      <div className="space-y-1">
                        {profile.social_media.twitter && (
                          <p className="text-sm">
                            <span className="text-gray-600">Twitter:</span>{" "}
                            {profile.social_media.twitter}
                          </p>
                        )}
                        {profile.social_media.linkedin && (
                          <p className="text-sm">
                            <span className="text-gray-600">LinkedIn:</span>{" "}
                            {profile.social_media.linkedin}
                          </p>
                        )}
                        {profile.social_media.facebook && (
                          <p className="text-sm">
                            <span className="text-gray-600">Facebook:</span>{" "}
                            {profile.social_media.facebook}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

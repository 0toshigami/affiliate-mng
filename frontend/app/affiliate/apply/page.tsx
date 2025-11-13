"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, getErrorMessage } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AffiliateApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    company_name: "",
    website_url: "",
    twitter: "",
    linkedin: "",
    facebook: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const social_media: Record<string, string> = {};
      if (formData.twitter) social_media.twitter = formData.twitter;
      if (formData.linkedin) social_media.linkedin = formData.linkedin;
      if (formData.facebook) social_media.facebook = formData.facebook;

      await apiClient.applyAsAffiliate({
        company_name: formData.company_name,
        website_url: formData.website_url || undefined,
        social_media,
      });

      router.push("/affiliate/profile");
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Apply to Become an Affiliate</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Fill out the form below to apply for our affiliate program
            </p>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Company Name *"
                name="company_name"
                required
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

              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Social Media (Optional)
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
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Submitting..." : "Submit Application"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

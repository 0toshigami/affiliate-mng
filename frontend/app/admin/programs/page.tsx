"use client";

import { useEffect, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api";
import { AffiliateProgram, ProgramStatus, ProgramType } from "@/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    program_type: ProgramType.SAAS,
    commission_value: "20",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPrograms = async () => {
    try {
      const data = await apiClient.listPrograms();
      setPrograms(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      await apiClient.createProgram({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        program_type: formData.program_type,
        commission_config: {
          type: "percentage",
          value: parseFloat(formData.commission_value),
        },
      });

      await fetchPrograms();
      setShowCreateModal(false);
      setFormData({
        name: "",
        slug: "",
        description: "",
        program_type: ProgramType.SAAS,
        commission_value: "20",
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from name
    if (name === "name") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const getStatusBadge = (status: ProgramStatus) => {
    const variants: Record<ProgramStatus, "success" | "warning" | "default"> = {
      active: "success",
      paused: "warning",
      archived: "default",
    };
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  if (isLoading) {
    return <div className="p-6">Loading programs...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Programs</h2>
          <p className="text-gray-600 mt-1">Manage affiliate programs</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Create Program</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.length === 0 ? (
          <Card className="col-span-full">
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                No programs found. Create your first program to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          programs.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{program.name}</CardTitle>
                  {getStatusBadge(program.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  {program.description || "No description"}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{program.program_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission:</span>
                    <span className="font-medium">
                      {program.commission_config.value}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slug:</span>
                    <span className="font-mono text-xs">{program.slug}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Program Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Program"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Program Name *"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., SaaS Referral Program"
          />

          <Input
            label="Slug *"
            name="slug"
            required
            value={formData.slug}
            onChange={handleInputChange}
            placeholder="auto-generated-from-name"
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Describe your affiliate program..."
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program Type *
            </label>
            <select
              name="program_type"
              value={formData.program_type}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value={ProgramType.SAAS}>SaaS</option>
              <option value={ProgramType.LEAD_GEN}>Lead Generation</option>
              <option value={ProgramType.CONTENT_MEDIA}>Content/Media</option>
            </select>
          </div>

          <Input
            label="Commission Rate (%) *"
            name="commission_value"
            type="number"
            step="0.01"
            min="0"
            max="100"
            required
            value={formData.commission_value}
            onChange={handleInputChange}
            placeholder="20"
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={actionLoading} className="flex-1">
              {actionLoading ? "Creating..." : "Create Program"}
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
    </div>
  );
}

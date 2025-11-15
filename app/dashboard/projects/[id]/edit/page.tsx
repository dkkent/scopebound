"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  clientName: string;
  projectType: string;
  projectBrief: string;
  hourlyRate: string;
  status: string;
};

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    projectType: "web",
    projectBrief: "",
    hourlyRate: "",
    status: "draft",
  });

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) return;

      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          // Normalize hourlyRate to 2 decimal places (Drizzle numeric returns strings with varying precision)
          const normalizedRate = parseFloat(data.project.hourlyRate).toFixed(2);
          setFormData({
            name: data.project.name,
            clientName: data.project.clientName,
            projectType: data.project.projectType,
            projectBrief: data.project.projectBrief,
            hourlyRate: normalizedRate,
            status: data.project.status,
          });
        } else if (response.status === 404) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    try {
      // Prepare update data with only project table fields
      // Zod schema will coerce hourlyRate string to number
      const updateData = {
        name: formData.name,
        clientName: formData.clientName,
        projectType: formData.projectType,
        projectBrief: formData.projectBrief,
        hourlyRate: formData.hourlyRate, // Send as-is, schema will coerce to number
        status: formData.status,
      };

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        router.push(`/dashboard/projects/${projectId}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update project");
      }
    } catch (err) {
      setError("Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center py-12" data-testid="loading-state">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href={`/dashboard/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          heading="Edit Project"
          text="Update project details and settings"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-md" data-testid="error-message">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-project-name"
              />
            </div>

            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
                data-testid="input-client-name"
              />
            </div>

            {/* Project Type */}
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type</Label>
              <Select
                value={formData.projectType}
                onValueChange={(value) => setFormData({ ...formData, projectType: value })}
              >
                <SelectTrigger id="projectType" data-testid="select-project-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web" data-testid="type-option-web">Web Application</SelectItem>
                  <SelectItem value="mobile" data-testid="type-option-mobile">Mobile App</SelectItem>
                  <SelectItem value="saas" data-testid="type-option-saas">SaaS Product</SelectItem>
                  <SelectItem value="ecommerce" data-testid="type-option-ecommerce">E-commerce</SelectItem>
                  <SelectItem value="custom" data-testid="type-option-custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Brief */}
            <div className="space-y-2">
              <Label htmlFor="projectBrief">Project Brief</Label>
              <Textarea
                id="projectBrief"
                value={formData.projectBrief}
                onChange={(e) => setFormData({ ...formData, projectBrief: e.target.value })}
                rows={10}
                required
                className="resize-y"
                data-testid="textarea-project-brief"
              />
            </div>

            {/* Hourly Rate */}
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                required
                data-testid="input-hourly-rate"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Project Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft" data-testid="status-option-draft">Draft</SelectItem>
                  <SelectItem value="form_sent" data-testid="status-option-form-sent">Form Sent</SelectItem>
                  <SelectItem value="scoping" data-testid="status-option-scoping">Scoping</SelectItem>
                  <SelectItem value="approved" data-testid="status-option-approved">Approved</SelectItem>
                  <SelectItem value="in_progress" data-testid="status-option-in-progress">In Progress</SelectItem>
                  <SelectItem value="completed" data-testid="status-option-completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                type="submit"
                disabled={saving}
                data-testid="button-save-project"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                asChild
                data-testid="button-cancel"
              >
                <Link href={`/dashboard/projects/${projectId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

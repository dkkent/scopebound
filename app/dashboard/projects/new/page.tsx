"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

type Organization = {
  id: string;
  name: string;
  role: string;
};

export default function NewProjectPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [defaultRate, setDefaultRate] = useState<string>("150");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: "",
    clientName: "",
    clientEmail: "",
    projectType: "web",
    projectBrief: "",
    hourlyRate: "",
  });

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch("/api/organizations");
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data.organizations);
          if (data.organizations.length > 0) {
            setSelectedOrg(data.organizations[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      }
    }
    fetchOrganizations();
  }, []);

  useEffect(() => {
    async function fetchDefaultRate() {
      if (!selectedOrg) return;
      
      try {
        const response = await fetch(`/api/organizations/${selectedOrg}/settings`);
        if (response.ok) {
          const data = await response.json();
          const rate = data.settings?.defaultHourlyRate || "150";
          setDefaultRate(rate);
          setFormData(prev => ({ ...prev, hourlyRate: rate }));
        }
      } catch (error) {
        console.error("Failed to fetch default rate:", error);
        setFormData(prev => ({ ...prev, hourlyRate: "150" }));
      }
    }
    fetchDefaultRate();
  }, [selectedOrg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) {
      setError("No organization selected");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          organizationId: selectedOrg,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/projects/${data.project.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create project");
      }
    } catch (err) {
      setError("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <PageHeader
          heading="Create New Project"
          text="Define your project scope and get started with client collaboration"
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
                placeholder="e.g., Website Redesign"
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
                placeholder="e.g., Acme Corporation"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                required
                data-testid="input-client-name"
              />
            </div>

            {/* Client Email */}
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="e.g., contact@acme.com"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                required
                data-testid="input-client-email"
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
                placeholder="Describe the project goals, key features, and any specific requirements. For example:&#10;&#10;We need a modern e-commerce platform with:&#10;- Product catalog with search and filters&#10;- Shopping cart and checkout flow&#10;- Payment processing integration&#10;- Order management dashboard&#10;- Customer accounts and order history&#10;&#10;The more detail you provide, the better we can scope the project."
                value={formData.projectBrief}
                onChange={(e) => setFormData({ ...formData, projectBrief: e.target.value })}
                rows={10}
                required
                className="resize-y"
                data-testid="textarea-project-brief"
              />
              <p className="text-sm text-muted-foreground">
                Provide as much detail as possible to help generate accurate timelines and forms
              </p>
            </div>

            {/* Hourly Rate */}
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                placeholder={defaultRate}
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                required
                data-testid="input-hourly-rate"
              />
              <p className="text-sm text-muted-foreground">
                Default rate: ${defaultRate}/hour (from organization settings)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                type="submit"
                disabled={loading}
                data-testid="button-save-project"
              >
                {loading ? "Creating..." : "Save as Draft"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled
                data-testid="button-generate-form"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Form (Coming Soon)
              </Button>
              <Button
                type="button"
                variant="ghost"
                asChild
                data-testid="button-cancel"
              >
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

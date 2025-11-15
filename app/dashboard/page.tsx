"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, FolderKanban } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganization } from "@/components/providers/organization-provider";

type Project = {
  id: string;
  name: string;
  clientName: string;
  projectType: string;
  status: string;
  createdAt: string;
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  draft: "secondary",
  form_sent: "default",
  scoping: "default",
  approved: "success",
  in_progress: "warning",
  completed: "success",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  form_sent: "Form Sent",
  scoping: "Scoping",
  approved: "Approved",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function DashboardPage() {
  const router = useRouter();
  const { organization, organizations } = useOrganization();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>(organization?.id || "");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organization && !selectedOrg) {
      setSelectedOrg(organization.id);
    }
  }, [organization, selectedOrg]);

  useEffect(() => {
    async function fetchProjects() {
      if (!selectedOrg) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const url = statusFilter === "all" 
          ? `/api/projects?organizationId=${selectedOrg}`
          : `/api/projects?organizationId=${selectedOrg}&status=${statusFilter}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects);
        } else {
          console.error("Failed to fetch projects:", response.status);
          setProjects([]);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [selectedOrg, statusFilter]);

  const filteredProjects = projects;

  if (!organization) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          heading="Projects"
          text="Manage your client projects and track their progress"
        />
        <Card className="border-destructive/50" data-testid="org-error">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-destructive mb-4">
              No organization found. Please create an organization first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          heading="Projects"
          text="Manage your client projects and track their progress"
        />
        <Button asChild data-testid="button-new-project">
          <Link href="/dashboard/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-xs">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="filter-option-all">All Projects</SelectItem>
              <SelectItem value="draft" data-testid="filter-option-draft">Draft</SelectItem>
              <SelectItem value="form_sent" data-testid="filter-option-form-sent">Form Sent</SelectItem>
              <SelectItem value="scoping" data-testid="filter-option-scoping">Scoping</SelectItem>
              <SelectItem value="approved" data-testid="filter-option-approved">Approved</SelectItem>
              <SelectItem value="in_progress" data-testid="filter-option-in-progress">In Progress</SelectItem>
              <SelectItem value="completed" data-testid="filter-option-completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {organizations.length > 1 && (
          <div className="flex-1 max-w-xs">
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger data-testid="select-organization">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id} data-testid={`org-option-${org.id}`}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="text-center py-12" data-testid="loading-state">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-dashed" data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Get started by creating your first project. You can define the scope, send forms to clients, and generate timelines.
            </p>
            <Button asChild data-testid="button-create-first-project">
              <Link href="/dashboard/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="projects-grid">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover-elevate active-elevate-2 cursor-pointer transition-all"
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              data-testid={`project-card-${project.id}`}
            >
              <CardHeader className="gap-2 space-y-0">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg" data-testid={`project-name-${project.id}`}>
                    {project.name}
                  </CardTitle>
                  <Badge 
                    variant={STATUS_VARIANTS[project.status] || "default"}
                    data-testid={`project-status-${project.id}`}
                  >
                    {STATUS_LABELS[project.status] || project.status}
                  </Badge>
                </div>
                <CardDescription data-testid={`project-client-${project.id}`}>
                  Client: {project.clientName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize" data-testid={`project-type-${project.id}`}>
                    {project.projectType}
                  </span>
                  <span className="text-muted-foreground" data-testid={`project-date-${project.id}`}>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

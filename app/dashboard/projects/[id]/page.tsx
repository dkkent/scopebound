"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Trash2, FileText, Clock, Activity } from "lucide-react";

type Project = {
  id: string;
  name: string;
  clientName: string;
  projectType: string;
  projectBrief: string;
  hourlyRate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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

const PROJECT_TYPE_LABELS: Record<string, string> = {
  web: "Web Application",
  mobile: "Mobile App",
  saas: "SaaS Product",
  ecommerce: "E-commerce",
  custom: "Custom",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) return;

      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data.project);
        } else if (response.status === 404) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId, router]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12" data-testid="loading-state">
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12" data-testid="not-found-state">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold" data-testid="project-name">
                {project.name}
              </h1>
              <Badge 
                variant={STATUS_VARIANTS[project.status] || "default"}
                data-testid="project-status"
              >
                {STATUS_LABELS[project.status] || project.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1" data-testid="project-client">
              Client: {project.clientName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild data-testid="button-edit">
            <Link href={`/dashboard/projects/${project.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            disabled={deleting}
            data-testid="button-delete"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6" data-testid="project-tabs">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="overview" data-testid="tab-trigger-overview">
            <FileText className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="form" data-testid="tab-trigger-form">
            <FileText className="h-4 w-4 mr-2" />
            Form
          </TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-trigger-timeline">
            <Clock className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-trigger-activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6" data-testid="tab-content-overview">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Basic information about this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Project Type</h4>
                <p className="mt-1" data-testid="project-type">
                  {PROJECT_TYPE_LABELS[project.projectType] || project.projectType}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Hourly Rate</h4>
                <p className="mt-1" data-testid="project-rate">
                  ${project.hourlyRate}/hour
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                <p className="mt-1" data-testid="project-created">
                  {new Date(project.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Last Updated</h4>
                <p className="mt-1" data-testid="project-updated">
                  {new Date(project.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Brief</CardTitle>
              <CardDescription>Description and requirements for this project</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap" data-testid="project-brief">
                {project.projectBrief}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Tab */}
        <TabsContent value="form" data-testid="tab-content-form">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Client Form</h3>
              <p className="text-muted-foreground max-w-md">
                Generate and send a custom intake form to your client to gather detailed requirements.
              </p>
              <Button className="mt-6" disabled data-testid="button-generate-form">
                Generate Form (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" data-testid="tab-content-timeline">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Project Timeline</h3>
              <p className="text-muted-foreground max-w-md">
                AI-generated project timeline with phases, milestones, and cost estimates based on your project brief.
              </p>
              <Button className="mt-6" disabled data-testid="button-generate-timeline">
                Generate Timeline (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" data-testid="tab-content-activity">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
              <p className="text-muted-foreground max-w-md">
                Track all changes, form submissions, and timeline updates for this project.
              </p>
              <p className="text-sm text-muted-foreground mt-4">No activity yet</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

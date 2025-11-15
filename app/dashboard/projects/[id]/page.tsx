"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Edit, Trash2, FileText, Clock, Activity, Sparkles, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { FormPreview } from "@/components/forms/FormPreview";
import type { FormSchema } from "@/components/forms/FormRenderer";
import { TimelineEditor } from "@/components/timeline/TimelineEditor";
import { useToast } from "@/hooks/use-toast";

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

type ProjectForm = {
  id: string;
  formData: FormSchema;
  submittedAt: string | null;
  submittedData: Record<string, any> | null;
  shareToken: string;
};

type ProjectTimeline = {
  id: string;
  timelineData: any;
  totalWeeks: string;
  totalHours: string;
  totalCost: string;
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
  const { toast } = useToast();
  const projectId = params?.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm | null>(null);
  const [projectTimeline, setProjectTimeline] = useState<ProjectTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [generatingForm, setGeneratingForm] = useState(false);
  const [sendingForm, setSendingForm] = useState(false);
  const [generatingTimeline, setGeneratingTimeline] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProject() {
      if (!projectId) return;

      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data.project);
          setProjectForm(data.form || null);
          setProjectTimeline(data.timeline || null);
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

  const handleGenerateForm = async () => {
    setGeneratingForm(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/generate-form`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate form");
      }

      // Update form state
      setProjectForm({
        id: data.formId,
        formData: data.formData,
        submittedAt: null,
        submittedData: null,
        shareToken: "", // Will be populated when sending
      });

      toast({
        title: "Form Generated!",
        description: "Your AI-powered intake form is ready to preview.",
      });
    } catch (error: any) {
      console.error("Form generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingForm(false);
    }
  };

  const handleSendForm = async () => {
    setSendingForm(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/send-form`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate share link");
      }

      setShareUrl(data.shareUrl);
      
      // Update project status
      if (project) {
        setProject({ ...project, status: "form_sent" });
      }

      toast({
        title: "Form Ready!",
        description: "Share link generated. You can now send this to your client.",
      });
    } catch (error: any) {
      console.error("Send form error:", error);
      toast({
        title: "Failed to Generate Link",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingForm(false);
    }
  };

  const copyShareLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Share link copied to clipboard.",
      });
    }
  };

  const handleGenerateTimeline = async () => {
    setGeneratingTimeline(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/generate-timeline`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate timeline");
      }

      setProjectTimeline(data.timeline);
      
      if (project) {
        setProject({ ...project, status: "scoping" });
      }

      toast({
        title: "Timeline Generated!",
        description: "AI-powered timeline is ready for review and editing.",
      });
    } catch (error: any) {
      console.error("Timeline generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate timeline. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingTimeline(false);
    }
  };

  const handleTimelineSaved = async () => {
    const response = await fetch(`/api/projects/${projectId}`);
    if (response.ok) {
      const data = await response.json();
      setProject(data.project);
      setProjectTimeline(data.timeline || null);
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
          {!projectForm ? (
            // No form generated yet
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI-Powered Client Form</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Generate a custom intake questionnaire using AI based on your project brief. 
                  Get detailed requirements from your client with smart questions and time/cost estimates.
                </p>
                <Button 
                  onClick={handleGenerateForm}
                  disabled={generatingForm}
                  size="lg"
                  data-testid="button-generate-form"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generatingForm ? "Generating Form..." : "Generate Form with AI"}
                </Button>
                {generatingForm && (
                  <p className="text-sm text-muted-foreground mt-4">
                    This may take 30-60 seconds. Claude AI is analyzing your project...
                  </p>
                )}
              </CardContent>
            </Card>
          ) : projectForm.submittedAt ? (
            // Form submitted - show responses
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Form Submitted
                      </CardTitle>
                      <CardDescription>
                        Submitted on {new Date(projectForm.submittedAt).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {projectForm.formData.sections.map((section, idx) => (
                      <div key={idx} className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-lg">{section.title}</h4>
                          {section.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                        {section.questions.map((question) => {
                          const answer = projectForm.submittedData?.[question.id];
                          return (
                            <div key={question.id} className="pl-4 border-l-2 border-border">
                              <p className="text-sm font-medium">{question.label}</p>
                              <p className="text-sm text-muted-foreground mt-1" data-testid={`answer-${question.id}`}>
                                {Array.isArray(answer) ? answer.join(", ") : answer || "No answer provided"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Form generated - show preview and send option
            <div className="space-y-6">
              {shareUrl ? (
                // Share link generated
                <Card>
                  <CardHeader>
                    <CardTitle>Form Sent to Client</CardTitle>
                    <CardDescription>
                      Share this link with your client to collect their responses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={shareUrl}
                        readOnly
                        data-testid="input-share-url"
                      />
                      <Button
                        variant="outline"
                        onClick={copyShareLink}
                        data-testid="button-copy-link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        asChild
                        data-testid="button-open-link"
                      >
                        <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Waiting for client to submit their responses...
                    </p>
                  </CardContent>
                </Card>
              ) : null}
              
              {/* Form Preview */}
              <FormPreview
                formSchema={projectForm.formData}
                onSendToClient={shareUrl ? undefined : handleSendForm}
                isSending={sendingForm}
                readOnly={!!shareUrl}
              />
            </div>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" data-testid="tab-content-timeline">
          {!projectTimeline ? (
            // No timeline generated yet
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI-Powered Timeline Generation</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Generate a detailed project timeline with phases, tasks, duration estimates, and cost breakdowns 
                  based on your project brief and client's form responses.
                </p>
                {!projectForm?.submittedAt ? (
                  <div className="max-w-md">
                    <p className="text-sm text-muted-foreground mb-4">
                      Timeline generation requires the client to submit the intake form first.
                    </p>
                    <Button disabled data-testid="button-generate-timeline">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Timeline
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button 
                      onClick={handleGenerateTimeline}
                      disabled={generatingTimeline}
                      size="lg"
                      data-testid="button-generate-timeline"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {generatingTimeline ? "Generating Timeline..." : "Generate Timeline with AI"}
                    </Button>
                    {generatingTimeline && (
                      <p className="text-sm text-muted-foreground mt-4">
                        This may take 30-60 seconds. Claude AI is analyzing the project scope...
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            // Timeline exists - show editor
            <TimelineEditor
              timeline={projectTimeline.timelineData}
              projectId={project.id}
              hourlyRate={project.hourlyRate}
              onSave={handleTimelineSaved}
            />
          )}
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

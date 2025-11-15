"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Layers } from "lucide-react";

interface CustomProjectType {
  id: string;
  name: string;
  description: string | null;
  defaultHourlyRate: string | null;
  aiPromptTemplate: string | null;
}

export function ProjectTypesSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [projectTypes, setProjectTypes] = useState<CustomProjectType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CustomProjectType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    defaultHourlyRate: "",
    aiPromptTemplate: "",
  });

  useEffect(() => {
    async function fetchProjectTypes() {
      try {
        const response = await fetch("/api/organization/project-types");
        if (response.ok) {
          const data = await response.json();
          setProjectTypes(data);
        }
      } catch (error) {
        console.error("Failed to fetch project types:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjectTypes();
  }, []);

  const handleOpenDialog = (type?: CustomProjectType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description || "",
        defaultHourlyRate: type.defaultHourlyRate || "",
        aiPromptTemplate: type.aiPromptTemplate || "",
      });
    } else {
      setEditingType(null);
      setFormData({
        name: "",
        description: "",
        defaultHourlyRate: "",
        aiPromptTemplate: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = editingType
        ? `/api/organization/project-types/${editingType.id}`
        : "/api/organization/project-types";

      const response = await fetch(url, {
        method: editingType ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save project type");
      }

      const savedType = await response.json();

      if (editingType) {
        setProjectTypes(types => types.map(t => t.id === savedType.id ? savedType : t));
      } else {
        setProjectTypes(types => [...types, savedType]);
      }

      toast({
        title: "Success",
        description: `Project type ${editingType ? "updated" : "created"} successfully.`,
      });

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save project type:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save project type. Please try again.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project type?")) {
      return;
    }

    try {
      const response = await fetch(`/api/organization/project-types/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project type");
      }

      setProjectTypes(types => types.filter(t => t.id !== id));

      toast({
        title: "Deleted",
        description: "Project type deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete project type:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete project type. Please try again.",
      });
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading project types...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Card data-testid="card-project-types">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Custom Project Types
              </CardTitle>
              <CardDescription className="mt-2">
                Define custom project types with specific rates and AI prompt templates
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} data-testid="button-add-type">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Type
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingType ? "Edit" : "Add"} Project Type
                  </DialogTitle>
                  <DialogDescription>
                    Configure project type settings and AI prompt templates
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="type-name">Name</Label>
                    <Input
                      id="type-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Enterprise SaaS"
                      data-testid="input-type-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type-description">Description</Label>
                    <Textarea
                      id="type-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this project type"
                      data-testid="input-type-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type-rate">Default Hourly Rate (USD)</Label>
                    <Input
                      id="type-rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.defaultHourlyRate}
                      onChange={(e) => setFormData({ ...formData, defaultHourlyRate: e.target.value })}
                      placeholder="150.00"
                      data-testid="input-type-rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type-prompt">AI Prompt Template (Optional)</Label>
                    <Textarea
                      id="type-prompt"
                      value={formData.aiPromptTemplate}
                      onChange={(e) => setFormData({ ...formData, aiPromptTemplate: e.target.value })}
                      placeholder="Custom prompt template for AI form generation..."
                      rows={6}
                      data-testid="input-type-prompt"
                    />
                    <p className="text-sm text-muted-foreground">
                      Use this to customize how AI generates forms for this project type
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-type"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} data-testid="button-save-type">
                    {editingType ? "Update" : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {projectTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No custom project types yet. Click "Add Type" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {projectTypes.map((type) => (
                <Card key={type.id} data-testid={`type-card-${type.id}`}>
                  <CardContent className="flex items-start justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold" data-testid={`type-name-${type.id}`}>
                          {type.name}
                        </h3>
                        {type.defaultHourlyRate && (
                          <span className="text-sm text-muted-foreground">
                            ${parseFloat(type.defaultHourlyRate).toFixed(2)}/hr
                          </span>
                        )}
                      </div>
                      {type.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {type.description}
                        </p>
                      )}
                      {type.aiPromptTemplate && (
                        <p className="text-xs text-muted-foreground">
                          Has custom AI prompt template
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenDialog(type)}
                        data-testid={`button-edit-${type.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(type.id)}
                        data-testid={`button-delete-${type.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Built-in Project Types</CardTitle>
          <CardDescription>
            These are the standard project types available to all organizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { value: "saas", label: "SaaS Product" },
              { value: "mobile", label: "Mobile App" },
              { value: "web", label: "Web Application" },
              { value: "ecommerce", label: "E-commerce" },
              { value: "custom", label: "Custom" },
            ].map((type) => (
              <div
                key={type.value}
                className="p-3 border rounded-md"
                data-testid={`builtin-type-${type.value}`}
              >
                <p className="font-medium">{type.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

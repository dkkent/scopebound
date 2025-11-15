"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Building2, DollarSign, Palette, Upload } from "lucide-react";

interface OrganizationSettings {
  id: string;
  organizationId: string;
  defaultHourlyRate: string;
  brandColor: string;
  logoUrl: string | null;
}

interface Organization {
  id: string;
  name: string;
}

export function GeneralSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [brandColor, setBrandColor] = useState("#10b981");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const [settingsRes, orgRes] = await Promise.all([
          fetch("/api/organization/settings"),
          fetch("/api/organization"),
        ]);

        if (settingsRes.ok) {
          const settings: OrganizationSettings = await settingsRes.json();
          setHourlyRate(settings.defaultHourlyRate || "150");
          setBrandColor(settings.brandColor || "#10b981");
          setLogoUrl(settings.logoUrl || "");
        }

        if (orgRes.ok) {
          const org: Organization = await orgRes.json();
          setOrgName(org.name);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load settings. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          defaultHourlyRate: hourlyRate,
          brandColor,
          logoUrl: logoUrl || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast({
        title: "Settings saved",
        description: "Your organization settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card data-testid="card-organization">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Details
          </CardTitle>
          <CardDescription>
            Update your organization name and basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="My Organization"
              data-testid="input-org-name"
            />
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-defaults">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Default Hourly Rate
          </CardTitle>
          <CardDescription>
            Set the default hourly rate for new projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hourly-rate">Hourly Rate (USD)</Label>
            <Input
              id="hourly-rate"
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="150.00"
              data-testid="input-hourly-rate"
            />
            <p className="text-sm text-muted-foreground">
              This will be used as the default rate when creating new projects
            </p>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-branding">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Customize your organization's brand colors and logo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-color">Brand Color</Label>
            <div className="flex gap-2">
              <Input
                id="brand-color"
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-20 h-10"
                data-testid="input-brand-color"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#10b981"
                className="flex-1"
                data-testid="input-brand-color-hex"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This color will be used for primary branding elements
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-url">Logo URL</Label>
            <div className="flex gap-2">
              <Input
                id="logo-url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="flex-1"
                data-testid="input-logo-url"
              />
              <Button variant="outline" size="icon" data-testid="button-upload-logo">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload feature coming soon with Cloudflare R2 integration
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          data-testid="button-save-general"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

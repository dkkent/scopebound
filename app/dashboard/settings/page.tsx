"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { ProjectTypesSettings } from "@/components/settings/ProjectTypesSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";

type Organization = {
  id: string;
  name: string;
  role: string;
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrganization() {
      try {
        const response = await fetch("/api/organizations");
        if (response.ok) {
          const data = await response.json();
          if (data.organizations && data.organizations.length > 0) {
            setOrganizationId(data.organizations[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch organization:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrganization();
  }, []);

  if (isLoading) {
    return (
      <div>
        <PageHeader
          heading="Settings"
          text="Manage your organization settings and preferences"
        />
        <div className="mt-6 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div>
        <PageHeader
          heading="Settings"
          text="Manage your organization settings and preferences"
        />
        <div className="mt-6 text-destructive">
          No organization found. Please create an organization first.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        heading="Settings"
        text="Manage your organization settings and preferences"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList data-testid="tabs-settings">
          <TabsTrigger value="general" data-testid="tab-general">
            General
          </TabsTrigger>
          <TabsTrigger value="project-types" data-testid="tab-project-types">
            Project Types
          </TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">
            Team
          </TabsTrigger>
          <TabsTrigger value="billing" data-testid="tab-billing">
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6" data-testid="content-general">
          <GeneralSettings organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="project-types" className="mt-6" data-testid="content-project-types">
          <ProjectTypesSettings organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="team" className="mt-6" data-testid="content-team">
          <TeamSettings organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="billing" className="mt-6" data-testid="content-billing">
          <BillingSettings organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

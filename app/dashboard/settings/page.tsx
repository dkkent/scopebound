"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { ProjectTypesSettings } from "@/components/settings/ProjectTypesSettings";
import { TeamSettings } from "@/components/settings/TeamSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

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
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="project-types" className="mt-6" data-testid="content-project-types">
          <ProjectTypesSettings />
        </TabsContent>

        <TabsContent value="team" className="mt-6" data-testid="content-team">
          <TeamSettings />
        </TabsContent>

        <TabsContent value="billing" className="mt-6" data-testid="content-billing">
          <BillingSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

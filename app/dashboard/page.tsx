import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { projects, organizationMembers, organizations } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

async function getUserOrganizations(userId: string) {
  const userOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizationMembers.organizationId, organizations.id)
    )
    .where(eq(organizationMembers.userId, userId));

  return userOrgs;
}

async function getProjects(organizationId: string) {
  const orgProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: projects.clientName,
      projectType: projects.projectType,
      status: projects.status,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(eq(projects.organizationId, organizationId))
    .orderBy(projects.createdAt);

  return orgProjects;
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  const userOrganizations = await getUserOrganizations(session.user.id);
  
  if (!userOrganizations || userOrganizations.length === 0) {
    return (
      <DashboardClient
        initialProjects={[]}
        organizations={[]}
        initialOrganization={null}
      />
    );
  }

  const initialOrganization = userOrganizations[0];
  const initialProjects = await getProjects(initialOrganization.id);

  return (
    <DashboardClient
      initialProjects={initialProjects}
      organizations={userOrganizations}
      initialOrganization={initialOrganization}
    />
  );
}

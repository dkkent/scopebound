import { Sidebar } from "@/components/dashboard/sidebar";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizations, organizationMembers } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function getDashboardData() {
  // Get session from BetterAuth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  // Get all organizations the user is a member of
  const userOrgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      ownerId: organizations.ownerId,
      createdAt: organizations.createdAt,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizationMembers.organizationId, organizations.id)
    )
    .where(eq(organizationMembers.userId, session.user.id));

  if (userOrgs.length === 0) {
    // User has no organizations - redirect to create one
    redirect("/onboarding");
  }

  // Use first org as current (in a real app, this would be stored in session/cookie)
  const currentOrg = userOrgs[0];

  return {
    user: {
      name: session.user.name,
      email: session.user.email,
    },
    currentOrganization: {
      id: currentOrg.id,
      name: currentOrg.name,
      role: currentOrg.role,
      ownerId: currentOrg.ownerId,
      createdAt: currentOrg.createdAt,
    },
    organizations: userOrgs.map(org => ({
      id: org.id,
      name: org.name,
      role: org.role,
      ownerId: org.ownerId,
      createdAt: org.createdAt,
    })),
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getDashboardData();

  return (
    <div className="flex h-screen">
      <Sidebar
        user={data.user}
        currentOrganization={data.currentOrganization}
        organizations={data.organizations}
      />
      <main className="flex-1 overflow-auto">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        <div className="px-6 py-8">{children}</div>
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { UserMenu } from "@/components/dashboard/user-menu";
import { OrganizationProvider } from "@/components/providers/organization-provider";
import { db } from "@/lib/db";
import { organizationMembers, organizations } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function checkAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  return {
    user: session.user,
  };
}

async function getUserOrganizations(userId: string) {
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
    .where(eq(organizationMembers.userId, userId));

  return userOrgs;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await checkAuth();
  const userOrganizations = await getUserOrganizations(user.id);

  return (
    <OrganizationProvider
      organization={userOrganizations[0] || null}
      organizations={userOrganizations}
    >
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Scopebound</h1>
            <UserMenu userName={user.name} userEmail={user.email} />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </div>
    </OrganizationProvider>
  );
}

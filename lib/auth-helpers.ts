import { db } from "@/lib/db";
import { organizationMembers } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export interface OrganizationMembership {
  userId: string;
  organizationId: string;
  role: "owner" | "member";
  id: string;
}

export async function verifyOrganizationMembership(
  userId: string,
  organizationId: string
): Promise<OrganizationMembership | null> {
  const [membership] = await db
    .select()
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      )
    )
    .limit(1);

  return membership || null;
}

export async function verifyOwnerAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const membership = await verifyOrganizationMembership(userId, organizationId);
  return membership?.role === "owner";
}

export async function verifyMemberAccess(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const membership = await verifyOrganizationMembership(userId, organizationId);
  return membership !== null;
}

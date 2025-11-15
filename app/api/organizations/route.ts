import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, organizationMembers } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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

    return NextResponse.json({ organizations: userOrgs });
  } catch (error) {
    console.error("Get organizations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

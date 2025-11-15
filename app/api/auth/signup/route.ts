import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, organizationMembers } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  organizationName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, organizationName } = signupSchema.parse(body);

    // Create user with BetterAuth
    const userResponse = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!userResponse || !userResponse.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    const userId = userResponse.user.id;

    // Create organization
    const orgId = randomUUID();
    await db.insert(organizations).values({
      id: orgId,
      name: organizationName,
      ownerId: userId,
    });

    // Add user as owner to the organization
    await db.insert(organizationMembers).values({
      id: randomUUID(),
      organizationId: orgId,
      userId: userId,
      role: "owner",
    });

    return NextResponse.json({
      success: true,
      user: userResponse.user,
      session: userResponse.session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

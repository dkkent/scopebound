import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations, organizationMembers } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { randomUUID } from "crypto";
import { authRateLimiter } from "@/lib/rate-limit";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  organizationName: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await authRateLimiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many signup attempts. Please try again later.",
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, name, organizationName} = signupSchema.parse(body);

    // Create a new request with just the auth data for BetterAuth
    const authRequest = new Request(new URL("/api/auth/sign-up/email", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    });

    // Call BetterAuth's handler directly to get proper cookie management
    const authResponse = await auth.handler(authRequest);
    const authData = await authResponse.clone().json();

    // If signup failed, return the error
    if (!authResponse.ok || !authData.user) {
      return new Response(authResponse.body, {
        status: authResponse.status,
        headers: authResponse.headers,
      });
    }

    const userId = authData.user.id;

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

    // Return BetterAuth's response with cookies intact
    return new Response(JSON.stringify({
      success: true,
      user: authData.user,
      session: authData.session,
    }), {
      status: 200,
      headers: authResponse.headers, // Preserve Set-Cookie header
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
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

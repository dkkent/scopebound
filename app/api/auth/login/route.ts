import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { authRateLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await authRateLimiter.check(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: "Too many login attempts. Please try again later.",
          retryAfter: rateLimitResult.reset
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Create a new Request object for BetterAuth
    const authRequest = new Request(new URL("/api/auth/sign-in/email", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    // Use BetterAuth's handler
    const handler = auth.handler;
    const response = await handler(authRequest);

    // Return the response from BetterAuth with all headers (including Set-Cookie)
    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 401 }
    );
  }
}

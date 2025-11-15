import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const authResponse = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!authResponse || !authResponse.user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create response with BetterAuth headers (including Set-Cookie)
    const response = NextResponse.json({
      success: true,
      user: authResponse.user,
      session: authResponse.session,
    });

    // Copy all headers from BetterAuth response to preserve Set-Cookie
    if (authResponse.headers) {
      authResponse.headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }
}

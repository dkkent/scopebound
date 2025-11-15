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

    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    if (!response || !response.user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: response.user,
      session: response.session,
    });
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

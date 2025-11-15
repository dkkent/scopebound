import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const authResponse = await auth.api.signOut({
      headers: request.headers,
    });

    // Create response with BetterAuth headers (including Set-Cookie to clear session)
    const response = NextResponse.json({ success: true });

    // Copy all headers from BetterAuth response to preserve Set-Cookie
    if (authResponse && authResponse.headers) {
      authResponse.headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}

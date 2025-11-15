import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

export function handleAPIError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof APIError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { 
        error: "Validation failed", 
        details: error.issues.map(issue => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { status: 400 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
}

export function unauthorized(message = "Unauthorized") {
  throw new APIError(401, message);
}

export function forbidden(message = "Forbidden") {
  throw new APIError(403, message);
}

export function notFound(message = "Not found") {
  throw new APIError(404, message);
}

export function badRequest(message: string, details?: any) {
  throw new APIError(400, message, details);
}

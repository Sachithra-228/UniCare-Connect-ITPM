import { NextResponse } from "next/server";

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.MONGODB_URI;
}

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** In development, include the underlying error message for debugging MongoDB/Firebase issues. */
export function errorMessageForDev(error: unknown): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  if (error instanceof Error) return error.message;
  return undefined;
}

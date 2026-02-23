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

/** True when the error is a MongoDB connection/timeout error (e.g. Atlas unreachable). */
export function isMongoConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = (error as { name?: string }).name;
  const message = String((error as { message?: string }).message ?? "");
  const cause = (error as { cause?: unknown }).cause;
  const causeMessage = cause && typeof cause === "object" ? String((cause as { message?: string }).message ?? "") : "";
  return (
    name === "MongoServerSelectionError" ||
    name === "MongoNetworkTimeoutError" ||
    name === "MongoNetworkError" ||
    message.includes("connectTimeoutMS") ||
    message.includes("secureConnect") ||
    causeMessage.includes("connectTimeoutMS") ||
    causeMessage.includes("secureConnect")
  );
}

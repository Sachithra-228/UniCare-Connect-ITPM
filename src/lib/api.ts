import { NextResponse } from "next/server";

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.MONGODB_URI;
}

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

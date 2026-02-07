import { NextRequest } from "next/server";
import { demoUsers } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";

export async function GET() {
  return jsonResponse(demoUsers);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "User created (demo mode)", payload }, 201);
  }
  return jsonResponse({ message: "User creation requires database setup." }, 501);
}

import { NextRequest } from "next/server";
import { demoMentorshipSessions } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";

export async function GET() {
  return jsonResponse(demoMentorshipSessions);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Session scheduled (demo mode)", payload }, 201);
  }
  return jsonResponse({ message: "Session creation requires database setup." }, 501);
}

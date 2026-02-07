import { NextRequest } from "next/server";
import { demoHealthLogs } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";

export async function GET() {
  return jsonResponse(demoHealthLogs);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Health log saved (demo mode)", payload }, 201);
  }
  return jsonResponse({ message: "Health log creation requires database setup." }, 501);
}

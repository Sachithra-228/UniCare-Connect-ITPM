import { NextRequest } from "next/server";
import { demoJobs } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";

export async function GET() {
  return jsonResponse(demoJobs);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Job listing created (demo mode)", payload }, 201);
  }
  return jsonResponse({ message: "Job creation requires database setup." }, 501);
}

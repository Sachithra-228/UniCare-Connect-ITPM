import { NextRequest } from "next/server";
import { demoScholarships } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";

export async function GET() {
  return jsonResponse(demoScholarships);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Scholarship created (demo mode)", payload }, 201);
  }
  return jsonResponse({ message: "Scholarship creation requires database setup." }, 501);
}

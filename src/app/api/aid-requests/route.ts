import { NextRequest } from "next/server";
import { jsonResponse, isDemoMode } from "@/lib/api";

const demoRequests = [
  {
    id: "aid1",
    category: "Emergency academic aid",
    status: "Under review",
    submittedAt: "2026-02-02"
  },
  {
    id: "aid2",
    category: "Equipment support",
    status: "Approved",
    submittedAt: "2026-01-20"
  }
];

export async function GET() {
  return jsonResponse(demoRequests);
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Aid request received (demo mode)", payload }, 201);
  }
  return jsonResponse({ message: "Aid request creation requires database setup." }, 501);
}

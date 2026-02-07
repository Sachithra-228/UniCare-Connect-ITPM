import { NextRequest } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { demoUsers } from "@/lib/demo-data";

const demoNotifications = [
  {
    id: "n1",
    title: "Aid application update",
    message: "Your emergency aid request is under review.",
    date: "2026-02-07"
  },
  {
    id: "n2",
    title: "Mentor session confirmed",
    message: "Your session with Ravindu is confirmed for Feb 12.",
    date: "2026-02-06"
  }
];

export async function GET() {
  return jsonResponse({ user: demoUsers[0], notifications: demoNotifications });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Notification created (demo mode)", payload }, 201);
  }
  return jsonResponse({ message: "Notification creation requires database setup." }, 501);
}

import { NextRequest } from "next/server";
import { demoUsers } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireSession } from "@/lib/session-auth";

export async function GET(request: NextRequest) {
  if (isDemoMode()) {
    const mentors = demoUsers.filter((u) => u.role === "mentor").map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      expertise: (u.roleDetails as Record<string, string> | undefined)?.expertise ?? "Career guidance",
      availability: (u.roleDetails as Record<string, string> | undefined)?.availability ?? "By request"
    }));
    return jsonResponse(mentors);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const database = await getMongoDatabase();
  const users = await database
    .collection("users")
    .find({ role: "mentor" })
    .project({ name: 1, email: 1, roleDetails: 1 })
    .toArray();

  const mentors = users.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    expertise: (u.roleDetails as Record<string, string> | undefined)?.expertise ?? "Career guidance",
    availability: (u.roleDetails as Record<string, string> | undefined)?.availability ?? "By request"
  }));

  return jsonResponse(mentors);
}

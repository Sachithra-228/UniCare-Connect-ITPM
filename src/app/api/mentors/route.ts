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
      profilePic: (u as { profilePic?: string }).profilePic ?? null,
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
    .project({ name: 1, email: 1, profilePic: 1, roleDetails: 1 })
    .toArray();

  let mentors = users.map((u: { _id: { toString: () => string }; name: string; email?: string; profilePic?: string; roleDetails?: Record<string, string> }) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    profilePic: u.profilePic ?? null,
    expertise: u.roleDetails?.expertise ?? "Career guidance",
    availability: u.roleDetails?.availability ?? "By request"
  }));

  // In development, if DB has no mentors, show demo data so the UI isn't blank
  if (mentors.length === 0 && process.env.NODE_ENV === "development") {
    mentors = demoUsers.filter((u) => u.role === "mentor").map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      profilePic: (u as { profilePic?: string }).profilePic ?? null,
      expertise: (u.roleDetails as Record<string, string> | undefined)?.expertise ?? "Career guidance",
      availability: (u.roleDetails as Record<string, string> | undefined)?.availability ?? "By request"
    }));
  }

  return jsonResponse(mentors);
}

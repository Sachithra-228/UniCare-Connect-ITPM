import { NextRequest } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { demoUsers } from "@/lib/demo-data";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

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

export async function GET(request: NextRequest) {
  if (isDemoMode()) {
    return jsonResponse({ user: demoUsers[0], notifications: demoNotifications });
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const database = await getMongoDatabase();
  const notifications = await database
    .collection("notifications")
    .find({
      $or: [
        { userId: authResult.session.user?._id },
        { userEmail: authResult.session.firebase.email },
        { audience: "all" }
      ]
    })
    .sort({ createdAt: -1 })
    .toArray();

  return jsonResponse({
    user: authResult.session.user,
    notifications: notifications.map((item) => ({
      ...item,
      _id: item._id.toString()
    }))
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Notification created (demo mode)", payload }, 201);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "super_admin", "mentor"]);
  if (roleCheck) {
    return roleCheck;
  }

  const database = await getMongoDatabase();
  const notificationsCollection = database.collection("notifications");
  const now = new Date();
  const document = {
    ...payload,
    createdBy: authResult.session.user?._id ?? authResult.session.firebase.uid,
    createdAt: now,
    updatedAt: now
  };
  const result = await notificationsCollection.insertOne(document);

  return jsonResponse(
    {
      message: "Notification created",
      notification: { ...document, _id: result.insertedId.toString() }
    },
    201
  );
}

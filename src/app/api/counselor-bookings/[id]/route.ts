import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";
import {
  getDemoCounselorBookings,
  updateDemoCounselorBooking
} from "@/lib/wellness-demo-store";

type RouteParams = { params: Promise<{ id: string }> };
type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

function isValidStatus(value: string): value is BookingStatus {
  return ["pending", "confirmed", "completed", "cancelled"].includes(value);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!id) return jsonResponse({ message: "Booking id is required." }, 400);

  const payload = await request.json().catch(() => ({} as { status?: string }));
  const nextStatus = String(payload.status ?? "").trim().toLowerCase();
  if (!isValidStatus(nextStatus)) {
    return jsonResponse({ message: "Invalid status." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const role = authResult.session.user?.role ?? "";
  const isAdmin = role === "admin" || role === "faculty" || role === "super_admin";
  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    const existing = getDemoCounselorBookings().find((item) => item._id === id);
    if (!existing) return jsonResponse({ message: "Booking not found." }, 404);

    const isOwner =
      (existing.userId && userId && existing.userId === userId) ||
      (existing.firebaseUid && existing.firebaseUid === firebaseUid);
    const allowed = isAdmin || (isOwner && nextStatus === "cancelled");
    if (!allowed) return jsonResponse({ message: "Forbidden" }, 403);

    const updated = updateDemoCounselorBooking(id, { status: nextStatus });
    return jsonResponse({ message: "Booking updated", booking: updated });
  }

  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return jsonResponse({ message: "Invalid booking id." }, 400);
  }

  const database = await getMongoDatabase();
  const bookingsCollection = database.collection("wellness_counselor_bookings");
  const existing = await bookingsCollection.findOne({ _id: new ObjectId(id) });
  if (!existing) return jsonResponse({ message: "Booking not found." }, 404);

  const isOwner =
    (typeof existing.userId === "string" && userId && existing.userId === userId) ||
    (typeof existing.firebaseUid === "string" && existing.firebaseUid === firebaseUid);
  const allowed = isAdmin || (isOwner && nextStatus === "cancelled");
  if (!allowed) return jsonResponse({ message: "Forbidden" }, 403);

  await bookingsCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: nextStatus, updatedAt: new Date() } }
  );
  const updated = await bookingsCollection.findOne({ _id: new ObjectId(id) });

  await Promise.allSettled([
    createNotification(database, {
      userId: typeof updated?.userId === "string" ? updated.userId : undefined,
      firebaseUid: typeof updated?.firebaseUid === "string" ? updated.firebaseUid : undefined,
      title: "Counselor booking updated",
      message: `Your booking status is now ${nextStatus}.`,
      type: "wellness",
      sectionId: "wellness"
    }),
    ...(isAdmin
      ? []
      : [
          createNotification(database, {
            audienceRoles: ["admin", "faculty", "super_admin"],
            title: "Counselor booking cancelled",
            message: "A student cancelled a counselor booking request.",
            type: "wellness",
            sectionId: "counselor-support"
          })
        ])
  ]);

  return jsonResponse({
    message: "Booking updated",
    booking: { ...updated, _id: updated?._id?.toString?.() ?? id }
  });
}


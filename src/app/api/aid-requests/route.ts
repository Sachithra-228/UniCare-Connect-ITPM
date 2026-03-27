import { NextRequest } from "next/server";
import { isMongoConnectionError, jsonResponse, isDemoMode } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

const demoRequests = [
  {
    _id: "aid1",
    id: "aid1",
    category: "Emergency academic aid",
    status: "Under review",
    submittedAt: "2026-02-02"
  },
  {
    _id: "aid2",
    id: "aid2",
    category: "Equipment support",
    status: "Approved",
    submittedAt: "2026-01-20"
  }
];

export async function GET(request: NextRequest) {
  const scope = request.nextUrl.searchParams.get("scope");
  if (isDemoMode()) {
    return jsonResponse(demoRequests);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const isAllScope = scope === "all";
  if (isAllScope) {
    const roleCheck = requireRole(authResult.session.user?.role, ["admin", "super_admin"]);
    if (roleCheck) {
      return roleCheck;
    }
  }

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase?.uid;
  const orClauses: { userId?: string; firebaseUid?: string }[] = [];
  if (userId) orClauses.push({ userId });
  if (firebaseUid) orClauses.push({ firebaseUid });
  const filter = isAllScope ? {} : orClauses.length ? { $or: orClauses } : {};

  try {
    const database = await getMongoDatabase();
    const requests = await database
      .collection("aid_requests")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return jsonResponse(
      requests.map((item: { _id?: unknown; [k: string]: unknown }) => ({
        ...item,
        _id: item._id?.toString?.() ?? String(item._id)
      }))
    );
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(demoRequests);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Aid request received (demo mode)", payload }, 201);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  try {
    const database = await getMongoDatabase();
    const requestsCollection = database.collection("aid_requests");
    const now = new Date();

    const document = {
      ...payload,
      userId: payload.userId ?? authResult.session.user?._id,
      firebaseUid: payload.firebaseUid ?? authResult.session.firebase.uid,
      status: payload.status ?? "pending",
      createdAt: now,
      updatedAt: now
    };

    const result = await requestsCollection.insertOne(document);
    const aidRequestId = result.insertedId.toString();
    const category = String(document.category ?? "financial aid request");

    await Promise.allSettled([
      createNotification(database, {
        userId: typeof document.userId === "string" ? document.userId : undefined,
        firebaseUid: typeof document.firebaseUid === "string" ? document.firebaseUid : undefined,
        title: "Aid request submitted",
        message: `Your ${category} has been submitted and is now under review.`,
        type: "financial-aid",
        sectionId: "financial-aid",
        relatedAidRequestId: aidRequestId
      }),
      createNotification(database, {
        audienceRoles: ["admin", "super_admin"],
        title: "New aid request",
        message: `A student submitted a new ${category}.`,
        type: "financial-aid",
        sectionId: "financial-oversight",
        relatedAidRequestId: aidRequestId
      }),
      createNotification(database, {
        audienceRoles: ["donor"],
        title: "Student aid request update",
        message: `A new ${category} request may need donor support.`,
        type: "financial-aid",
        sectionId: "donations",
        relatedAidRequestId: aidRequestId
      }),
      createNotification(database, {
        audienceRoles: ["ngo"],
        title: "Student aid request update",
        message: `A new ${category} request may require funding allocation.`,
        type: "financial-aid",
        sectionId: "funding",
        relatedAidRequestId: aidRequestId
      })
    ]);

    return jsonResponse(
      {
        message: "Aid request saved",
        aidRequest: { ...document, _id: aidRequestId }
      },
      201
    );
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(
        { message: "Database temporarily unavailable. Please try again later.", error: "MongoUnavailable" },
        503
      );
    }
    throw error;
  }
}

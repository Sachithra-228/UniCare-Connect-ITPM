import { NextRequest } from "next/server";
import { demoScholarships } from "@/lib/demo-data";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

export async function GET() {
  if (isDemoMode()) {
    return jsonResponse(demoScholarships);
  }

  try {
    const database = await getMongoDatabase();
    const scholarships = await database
      .collection("scholarships")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const list = scholarships.map((item: { _id?: unknown; [k: string]: unknown }) => ({
      ...item,
      _id: item._id?.toString?.() ?? String(item._id)
    }));

    if (list.length === 0) {
      return jsonResponse(demoScholarships);
    }
    return jsonResponse(list);
  } catch {
    return jsonResponse(demoScholarships);
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  if (isDemoMode()) {
    return jsonResponse({ message: "Scholarship created (demo mode)", payload }, 201);
  }

  const authResult = await requireSession(request);
  if (authResult.error) {
    return authResult.error;
  }

  const roleCheck = requireRole(authResult.session.user?.role, [
    "admin",
    "super_admin",
    "donor",
    "ngo"
  ]);
  if (roleCheck) {
    return roleCheck;
  }

  const database = await getMongoDatabase();
  const scholarshipsCollection = database.collection("scholarships");
  const now = new Date();
  const document = {
    ...payload,
    createdBy: authResult.session.user?._id ?? authResult.session.firebase.uid,
    createdAt: now,
    updatedAt: now
  };
  const result = await scholarshipsCollection.insertOne(document);
  const scholarshipId = result.insertedId.toString();
  const title = String(document.title ?? document.name ?? "scholarship");
  const creatorRole = authResult.session.user?.role ?? "";

  await Promise.allSettled([
    createNotification(database, {
      userId: authResult.session.user?._id,
      firebaseUid: authResult.session.firebase.uid,
      title: "Scholarship published",
      message: `Your scholarship "${title}" is now live.`,
      type: "financial-aid",
      sectionId:
        creatorRole === "donor"
          ? "my-scholarships"
          : creatorRole === "ngo"
            ? "programs"
            : "financial-oversight",
      relatedScholarshipId: scholarshipId
    }),
    createNotification(database, {
      audienceRoles: ["student"],
      title: "New scholarship available",
      message: `A new scholarship "${title}" is available.`,
      type: "financial-aid",
      sectionId: "financial-aid",
      relatedScholarshipId: scholarshipId
    }),
    createNotification(database, {
      audienceRoles: ["parent"],
      title: "Scholarship update",
      message: `A new scholarship "${title}" may be relevant to your student.`,
      type: "financial-aid",
      sectionId: "financial-overview",
      relatedScholarshipId: scholarshipId
    })
  ]);

  return jsonResponse(
    {
      message: "Scholarship created",
      scholarship: { ...document, _id: scholarshipId }
    },
    201
  );
}

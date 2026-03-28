import { NextRequest } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { addDemoDocument } from "@/lib/my-applications-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const name = String(payload.name ?? "").trim().slice(0, 220);
  const size = Math.max(0, Number(payload.size ?? 0));
  const linkedTo = String(payload.linkedTo ?? "").trim().slice(0, 200);
  const mimeType = String(payload.mimeType ?? "").trim().slice(0, 120);

  if (!name) {
    return jsonResponse({ message: "Document name is required." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    const document = addDemoDocument({
      userId,
      firebaseUid,
      name,
      size,
      linkedTo: linkedTo || undefined,
      mimeType: mimeType || undefined
    });
    return jsonResponse({ message: "Document saved", document }, 201);
  }

  const database = await getMongoDatabase();
  const now = new Date();
  const document = {
    name,
    size,
    linkedTo: linkedTo || undefined,
    mimeType: mimeType || undefined,
    userId,
    firebaseUid,
    uploadedAt: now.toISOString(),
    createdAt: now,
    updatedAt: now
  };
  const result = await database.collection("application_documents").insertOne(document);
  await createNotification(database, {
    userId,
    firebaseUid,
    title: "Document uploaded",
    message: `${name} was added to your application documents.`,
    type: "application",
    sectionId: "my-applications"
  });

  return jsonResponse(
    {
      message: "Document saved",
      document: {
        _id: result.insertedId.toString(),
        name: document.name,
        size: document.size,
        linkedTo: document.linkedTo,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt
      }
    },
    201
  );
}

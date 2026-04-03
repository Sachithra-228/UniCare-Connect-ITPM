import { ObjectId } from "mongodb";
import { NextRequest } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { upsertDemoCampusInteraction } from "@/lib/campus-life-demo-store";
import { CampusLifeInteractionType } from "@/lib/campus-life-types";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireSession } from "@/lib/session-auth";

const COLLECTION_BY_TYPE: Record<CampusLifeInteractionType, string> = {
  event: "campus_events",
  club: "campus_clubs",
  announcement: "campus_announcements",
  discount: "campus_discounts",
  volunteer: "campus_volunteer_roles"
};

function isValidInteractionType(value: string): value is CampusLifeInteractionType {
  return ["event", "club", "announcement", "discount", "volunteer"].includes(value);
}

function normalizeItemId(value: unknown) {
  return String(value ?? "").trim();
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const typeRaw = String(payload.type ?? payload.itemType ?? "").trim().toLowerCase();
  if (!isValidInteractionType(typeRaw)) {
    return jsonResponse({ message: "Invalid interaction type." }, 400);
  }
  const itemId = normalizeItemId(payload.itemId);
  if (!itemId) {
    return jsonResponse({ message: "itemId is required." }, 400);
  }
  const value = Boolean(payload.value);

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const userName = authResult.session.user?.name ?? authResult.session.firebase.displayName ?? "Student";

  if (isDemoMode()) {
    upsertDemoCampusInteraction({
      itemType: typeRaw,
      itemId,
      value,
      userId,
      firebaseUid
    });
    return jsonResponse({ message: "Campus interaction updated" });
  }

  const database = await getMongoDatabase();
  const collectionName = COLLECTION_BY_TYPE[typeRaw];
  const collection = database.collection(collectionName);
  const target =
    itemId.length === 24 && /^[a-f0-9]{24}$/i.test(itemId)
      ? await collection.findOne({ _id: new ObjectId(itemId), isActive: { $ne: false } })
      : null;
  if (!target) {
    return jsonResponse({ message: "Item not found." }, 404);
  }

  const identityFilters: Record<string, unknown>[] = [];
  if (userId) identityFilters.push({ userId });
  if (firebaseUid) identityFilters.push({ firebaseUid });
  if (!identityFilters.length) {
    return jsonResponse({ message: "Invalid user identity." }, 400);
  }

  const now = new Date();
  await database.collection("campus_life_interactions").updateOne(
    {
      itemType: typeRaw,
      itemId,
      $or: identityFilters
    },
    {
      $set: {
        itemType: typeRaw,
        itemId,
        userId,
        firebaseUid,
        value,
        updatedAt: now
      },
      $setOnInsert: {
        createdAt: now
      }
    },
    { upsert: true }
  );

  if (value && (typeRaw === "event" || typeRaw === "club" || typeRaw === "volunteer")) {
    const title =
      typeRaw === "event"
        ? "Student event interest"
        : typeRaw === "club"
          ? "Student joined a club"
          : "Student volunteer sign-up";
    const itemName =
      typeRaw === "event"
        ? String((target as { title?: string }).title ?? "an event")
        : typeRaw === "club"
          ? String((target as { name?: string }).name ?? "a club")
          : String((target as { title?: string }).title ?? "a volunteer role");
    await createNotification(database, {
      audienceRoles: ["admin", "super_admin"],
      title,
      message: `${userName} updated campus participation: ${itemName}.`,
      type: "campus-life",
      sectionId: "announcements"
    });
  }

  return jsonResponse({ message: "Campus interaction updated" });
}

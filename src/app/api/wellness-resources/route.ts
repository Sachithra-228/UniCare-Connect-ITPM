import { NextRequest } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";
import { addDemoWellnessResource, getDemoWellnessResources } from "@/lib/wellness-demo-store";

type ResourceDocument = {
  _id?: { toString: () => string };
  title?: string;
  description?: string;
  url?: string;
  category?: string;
  language?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;

  const category = request.nextUrl.searchParams.get("category")?.trim().toLowerCase();
  const language = request.nextUrl.searchParams.get("language")?.trim().toLowerCase();

  if (isDemoMode()) {
    const list = getDemoWellnessResources().filter(
      (item) =>
        (!category || item.category === category) &&
        (!language || item.language === language)
    );
    return jsonResponse(list);
  }

  const database = await getMongoDatabase();
  const filter: Record<string, unknown> = { isActive: { $ne: false } };
  if (category) filter.category = category;
  if (language) filter.language = language;

  const resources = await database
    .collection("wellness_resources")
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return jsonResponse(
    resources.map((item: ResourceDocument) => ({
      ...item,
      _id: item._id?.toString?.() ?? ""
    }))
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const title = String(payload.title ?? "").trim();
  const description = String(payload.description ?? "").trim();
  const url = typeof payload.url === "string" && payload.url.trim().length ? payload.url.trim() : "";
  const categoryRaw = String(payload.category ?? "self-care").trim().toLowerCase();
  const category = ["mental-health", "self-care", "nutrition", "sleep", "crisis-support"].includes(categoryRaw)
    ? categoryRaw
    : "self-care";
  const languageRaw = String(payload.language ?? "en").trim().toLowerCase();
  const language = ["en", "si", "ta"].includes(languageRaw) ? languageRaw : "en";

  if (!title || !description) {
    return jsonResponse({ message: "Title and description are required." }, 400);
  }

  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["admin", "faculty", "super_admin"]);
  if (roleCheck) return roleCheck;

  const nowIso = new Date().toISOString();
  if (isDemoMode()) {
    const resource = addDemoWellnessResource({
      title,
      description,
      url,
      category: category as "mental-health" | "self-care" | "nutrition" | "sleep" | "crisis-support",
      language: language as "en" | "si" | "ta",
      isActive: true,
      createdAt: nowIso,
      updatedAt: nowIso
    });
    return jsonResponse({ message: "Resource added", resource }, 201);
  }

  const database = await getMongoDatabase();
  const now = new Date();
  const document = {
    title,
    description,
    url,
    category,
    language,
    isActive: true,
    createdBy: authResult.session.user?._id ?? authResult.session.firebase.uid,
    createdAt: now,
    updatedAt: now
  };
  const result = await database.collection("wellness_resources").insertOne(document);

  await Promise.allSettled([
    createNotification(database, {
      audienceRoles: ["student"],
      title: "New wellness resource",
      message: `${title} is now available in Wellness resources.`,
      type: "wellness",
      sectionId: "wellness"
    }),
    createNotification(database, {
      audienceRoles: ["parent"],
      title: "New student support resource",
      message: `${title} was added to wellness support resources.`,
      type: "wellness",
      sectionId: "resources"
    })
  ]);

  return jsonResponse(
    { message: "Resource added", resource: { ...document, _id: result.insertedId.toString() } },
    201
  );
}


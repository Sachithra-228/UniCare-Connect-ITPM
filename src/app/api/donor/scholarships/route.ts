import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, jsonResponse } from "@/lib/api";
import {
  createDemoDonorScholarship,
  listDemoDonorScholarships
} from "@/lib/donor-scholarships-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type ScholarshipDocument = {
  _id?: ObjectId;
  title?: string;
  provider?: string;
  amount?: string | number;
  deadline?: string;
  eligibilityCriteria?: string;
  applicationLink?: string;
  tags?: string[];
  status?: string;
  createdBy?: string;
  createdByUserId?: string;
  createdByFirebaseUid?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

function normalizeStatus(value: unknown): "active" | "closed" {
  return String(value ?? "").trim().toLowerCase() === "closed" ? "closed" : "active";
}

function normalizeAmount(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return "LKR 0";
  return text.toUpperCase().includes("LKR") ? text : `LKR ${text}`;
}

function toIso(value: Date | string | undefined) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === "string" && value.trim().length) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
  }
  return new Date().toISOString();
}

function matchesIdentity(value: unknown, identities: string[]) {
  const owner = String(value ?? "").trim();
  return owner.length > 0 && identities.includes(owner);
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
      .slice(0, 10);
  }
  const fromString = String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set(fromString)].slice(0, 10);
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const identities = [...(userId ? [userId] : []), ...(firebaseUid ? [firebaseUid] : [])];

  if (isDemoMode()) {
    return jsonResponse(listDemoDonorScholarships({ userId, firebaseUid }));
  }

  const database = await getMongoDatabase();
  const scholarships = await database
    .collection<ScholarshipDocument>("scholarships")
    .find({
      $or: [
        ...(userId ? [{ createdByUserId: userId }, { createdBy: userId }] : []),
        ...(firebaseUid ? [{ createdByFirebaseUid: firebaseUid }, { createdBy: firebaseUid }] : [])
      ]
    })
    .sort({ createdAt: -1 })
    .toArray();

  return jsonResponse(
    scholarships.map((item) => ({
      _id: item._id?.toString?.() ?? "",
      title: item.title ?? "Scholarship",
      provider: item.provider ?? "Donor / CSR Partner",
      amount: normalizeAmount(item.amount),
      deadline: String(item.deadline ?? ""),
      eligibilityCriteria: item.eligibilityCriteria ?? "",
      applicationLink: item.applicationLink ?? "",
      tags: Array.isArray(item.tags) ? item.tags.map((t) => String(t)) : [],
      status: normalizeStatus(item.status),
      editable: matchesIdentity(item.createdByUserId, identities) || matchesIdentity(item.createdByFirebaseUid, identities) || matchesIdentity(item.createdBy, identities),
      createdAt: toIso(item.createdAt),
      updatedAt: toIso(item.updatedAt)
    }))
  );
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const title = String(payload.title ?? "").trim().slice(0, 120);
  if (!title) return jsonResponse({ message: "Scholarship title is required." }, 400);

  const amount = normalizeAmount(payload.amount);
  const deadline = String(payload.deadline ?? "").trim().slice(0, 30);
  if (!deadline) return jsonResponse({ message: "Application deadline is required." }, 400);

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;
  const donorName =
    String(payload.provider ?? "").trim().slice(0, 120) ||
    authResult.session.user?.name ||
    authResult.session.firebase.displayName ||
    "Donor / CSR Partner";
  const eligibilityCriteria = String(payload.eligibilityCriteria ?? "").trim().slice(0, 500);
  const applicationLink = String(payload.applicationLink ?? "").trim().slice(0, 500);
  const tags = parseTags(payload.tags);
  const now = new Date();

  if (isDemoMode()) {
    const created = createDemoDonorScholarship({
      title,
      provider: donorName,
      amount,
      deadline,
      eligibilityCriteria,
      applicationLink,
      tags,
      status: "active",
      donorUserId: userId,
      donorFirebaseUid: firebaseUid,
      createdBy: userId ?? firebaseUid
    });
    return jsonResponse({ message: "Scholarship created.", scholarship: created }, 201);
  }

  const database = await getMongoDatabase();
  const document = {
    title,
    provider: donorName,
    amount,
    deadline,
    eligibilityCriteria,
    applicationLink,
    tags,
    status: "active",
    createdBy: userId ?? firebaseUid,
    createdByUserId: userId,
    createdByFirebaseUid: firebaseUid,
    createdAt: now,
    updatedAt: now
  };
  const result = await database.collection("scholarships").insertOne(document);
  const scholarshipId = result.insertedId.toString();

  await Promise.allSettled([
    createNotification(database, {
      userId,
      firebaseUid,
      title: "Scholarship published",
      message: `Your scholarship "${title}" is now available to students.`,
      type: "financial-aid",
      sectionId: "my-scholarships",
      relatedScholarshipId: scholarshipId
    }),
    createNotification(database, {
      audienceRoles: ["student"],
      title: "New scholarship available",
      message: `"${title}" is now open for applications.`,
      type: "financial-aid",
      sectionId: "financial-aid",
      relatedScholarshipId: scholarshipId
    }),
    createNotification(database, {
      audienceRoles: ["admin", "super_admin"],
      title: "Scholarship published",
      message: `Donor scholarship "${title}" has been created.`,
      type: "financial-aid",
      sectionId: "financial-oversight",
      relatedScholarshipId: scholarshipId
    })
  ]);

  return jsonResponse(
    {
      message: "Scholarship created.",
      scholarship: {
        ...document,
        _id: scholarshipId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    },
    201
  );
}

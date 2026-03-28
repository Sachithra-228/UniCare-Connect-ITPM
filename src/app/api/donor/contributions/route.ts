import { NextRequest } from "next/server";
import { isDemoMode, jsonResponse } from "@/lib/api";
import {
  addDemoDonorContribution,
  listDemoDonorContributions
} from "@/lib/donor-contributions-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { createNotification } from "@/lib/notifications";
import { requireRole, requireSession } from "@/lib/session-auth";

type ContributionType = "emergency_fund" | "equipment" | "scholarship" | "general";

type ContributionDocument = {
  _id?: { toString: () => string };
  donorUserId?: string;
  donorFirebaseUid?: string;
  donorEmail?: string;
  donorName?: string;
  contributionType?: ContributionType;
  program?: string;
  category?: string;
  amountLkr?: number;
  note?: string;
  receiptNumber?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const VALID_TYPES: ContributionType[] = ["emergency_fund", "equipment", "scholarship", "general"];

function toType(value: unknown): ContributionType {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (VALID_TYPES.includes(normalized as ContributionType)) {
    return normalized as ContributionType;
  }
  return "general";
}

function toCategory(type: ContributionType, category?: string) {
  const custom = String(category ?? "").trim();
  if (custom) return custom.slice(0, 140);
  if (type === "emergency_fund") return "Emergency aid";
  if (type === "equipment") return "Equipment support";
  if (type === "scholarship") return "Scholarship support";
  return "General student support";
}

function parseAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const digits = value.replace(/[^\d]/g, "");
    if (!digits) return 0;
    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return 0;
}

function receiptNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `DNT-${y}${m}${d}-${random}`;
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    return jsonResponse(listDemoDonorContributions({ userId, firebaseUid }));
  }

  const database = await getMongoDatabase();
  const filter = {
    $or: [...(userId ? [{ donorUserId: userId }] : []), ...(firebaseUid ? [{ donorFirebaseUid: firebaseUid }] : [])]
  };
  const rows = await database
    .collection<ContributionDocument>("donor_contributions")
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();

  return jsonResponse(
    rows.map((item) => ({
      ...item,
      _id: item._id?.toString?.() ?? "",
      createdAt:
        item.createdAt instanceof Date
          ? item.createdAt.toISOString()
          : typeof item.createdAt === "string"
            ? item.createdAt
            : new Date().toISOString()
    }))
  );
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({} as Record<string, unknown>));
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const amountLkr = parseAmount(payload.amountLkr);
  if (!amountLkr) {
    return jsonResponse({ message: "Amount is required." }, 400);
  }

  const contributionType = toType(payload.contributionType);
  const category = toCategory(contributionType, payload.category);
  const program = String(payload.program ?? "").trim().slice(0, 140) || category;
  const note = String(payload.note ?? "").trim().slice(0, 500) || undefined;

  const donorUserId = authResult.session.user?._id;
  const donorFirebaseUid = authResult.session.firebase.uid;
  const donorEmail = authResult.session.user?.email ?? authResult.session.firebase.email ?? undefined;
  const donorName = authResult.session.user?.name ?? authResult.session.firebase.displayName ?? "Donor";

  if (isDemoMode()) {
    const created = addDemoDonorContribution({
      donorUserId,
      donorFirebaseUid,
      donorEmail,
      donorName,
      contributionType,
      program,
      category,
      amountLkr,
      note
    });
    return jsonResponse({ message: "Contribution logged.", contribution: created }, 201);
  }

  const now = new Date();
  const database = await getMongoDatabase();
  const document = {
    donorUserId,
    donorFirebaseUid,
    donorEmail,
    donorName,
    contributionType,
    program,
    category,
    amountLkr,
    note,
    receiptNumber: receiptNumber(),
    createdAt: now,
    updatedAt: now
  };
  const result = await database.collection("donor_contributions").insertOne(document);
  const contributionId = result.insertedId.toString();

  await Promise.allSettled([
    createNotification(database, {
      userId: donorUserId,
      firebaseUid: donorFirebaseUid,
      title: "Contribution logged",
      message: `Your LKR ${amountLkr} contribution was recorded successfully.`,
      type: "financial-aid",
      sectionId: "donations"
    }),
    createNotification(database, {
      audienceRoles: ["admin", "super_admin"],
      title: "New donor contribution",
      message: `${donorName} logged a LKR ${amountLkr} contribution for ${category}.`,
      type: "financial-aid",
      sectionId: "financial-oversight"
    })
  ]);

  return jsonResponse(
    {
      message: "Contribution logged.",
      contribution: { ...document, _id: contributionId, createdAt: now.toISOString() }
    },
    201
  );
}

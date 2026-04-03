import { Db } from "mongodb";
import type { UserRole } from "@/types";

type CreateNotificationInput = {
  userId?: string | null;
  userEmail?: string | null;
  firebaseUid?: string | null;
  audience?: "all";
  audienceRoles?: UserRole[];
  title: string;
  message: string;
  type?: string;
  sectionId?: string;
  relatedAidRequestId?: string;
  relatedSessionId?: string;
  relatedJobId?: string;
  relatedScholarshipId?: string;
};

function normalizeText(value: string) {
  return value.trim();
}

function normalizeRoleList(roles?: UserRole[]) {
  if (!roles?.length) return [];
  return [...new Set(roles.filter(Boolean))];
}

export async function createNotification(database: Db, input: CreateNotificationInput) {
  const title = normalizeText(input.title ?? "");
  const message = normalizeText(input.message ?? "");
  if (!title || !message) return;

  const hasTarget =
    Boolean(input.userId) ||
    Boolean(input.userEmail) ||
    Boolean(input.firebaseUid) ||
    input.audience === "all" ||
    Boolean(normalizeRoleList(input.audienceRoles).length);
  if (!hasTarget) return;

  const now = new Date();
  await database.collection("notifications").insertOne({
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.userEmail ? { userEmail: input.userEmail } : {}),
    ...(input.firebaseUid ? { firebaseUid: input.firebaseUid } : {}),
    ...(input.audience ? { audience: input.audience } : {}),
    ...(input.audienceRoles?.length ? { audienceRoles: normalizeRoleList(input.audienceRoles) } : {}),
    title,
    message,
    read: false,
    date: now.toISOString().slice(0, 10),
    ...(input.type ? { type: input.type } : {}),
    ...(input.sectionId ? { sectionId: input.sectionId } : {}),
    ...(input.relatedAidRequestId ? { relatedAidRequestId: input.relatedAidRequestId } : {}),
    ...(input.relatedSessionId ? { relatedSessionId: input.relatedSessionId } : {}),
    ...(input.relatedJobId ? { relatedJobId: input.relatedJobId } : {}),
    ...(input.relatedScholarshipId ? { relatedScholarshipId: input.relatedScholarshipId } : {}),
    createdAt: now,
    updatedAt: now
  });
}

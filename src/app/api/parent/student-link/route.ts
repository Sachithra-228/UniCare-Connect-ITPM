import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getMongoDatabase } from "@/lib/mongodb";
import { normalizeText, requireParentIdentity } from "@/lib/parent-api-auth";
import { extractParentLinkHints, resolveParentLinkedStudent } from "@/lib/parent-link";
import { invalidateSessionUserCache } from "@/lib/session-auth";

type UserDoc = {
  _id: ObjectId;
  firebaseUid?: string;
  email?: string;
  name?: string;
  role?: string;
  roleDetails?: Record<string, unknown>;
  isDeleted?: boolean;
};

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function extractRoleDetails(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {} as Record<string, unknown>;
  }
  return input as Record<string, unknown>;
}

export async function GET(request: NextRequest) {
  const parent = await requireParentIdentity(request);
  if ("error" in parent) return parent.error;

  if (isDemoMode()) {
    return jsonResponse({
      linkHints: {
        linkedStudentId: "",
        linkedStudentFirebaseUid: "",
        linkedStudentEmail: "",
        linkedStudentName: "Sajini Perera"
      },
      linkedStudent: {
        _id: "u1",
        name: "Sajini Perera",
        email: "student@unicare.lk",
        linkSource: "name"
      }
    });
  }

  try {
    const database = await getMongoDatabase();
    const linkedStudent = await resolveParentLinkedStudent(database, parent.identity.roleDetails);
    return jsonResponse({
      linkHints: extractParentLinkHints(parent.identity.roleDetails),
      linkedStudent: linkedStudent
        ? {
            _id: linkedStudent._id,
            firebaseUid: linkedStudent.firebaseUid ?? "",
            email: linkedStudent.email ?? "",
            name: linkedStudent.name ?? "Student",
            university: linkedStudent.university ?? "",
            linkSource: linkedStudent.linkSource
          }
        : null
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(
        { message: "Database temporarily unavailable. Please try again later.", code: "MongoUnavailable" },
        503
      );
    }
    throw error;
  }
}

export async function PUT(request: NextRequest) {
  const parent = await requireParentIdentity(request);
  if ("error" in parent) return parent.error;

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const linkedStudentId = normalizeText(payload.linkedStudentId, 80);
  const linkedStudentFirebaseUid = normalizeText(payload.linkedStudentFirebaseUid, 150);
  const linkedStudentEmail = normalizeEmail(payload.linkedStudentEmail);
  const linkedStudentName = normalizeText(payload.linkedStudentName, 120);

  if (!linkedStudentId && !linkedStudentFirebaseUid && !linkedStudentEmail && !linkedStudentName) {
    return jsonResponse(
      {
        message: "Provide one of: linkedStudentId, linkedStudentFirebaseUid, linkedStudentEmail, linkedStudentName."
      },
      400
    );
  }

  if (isDemoMode()) {
    return jsonResponse({
      message: "Student link updated",
      linkedStudent: {
        _id: "u1",
        name: linkedStudentName || "Sajini Perera",
        email: linkedStudentEmail || "student@unicare.lk",
        linkSource: "name"
      }
    });
  }

  try {
    const database = await getMongoDatabase();
    const users = database.collection<UserDoc>("users");

    let student: UserDoc | null = null;
    if (linkedStudentId && ObjectId.isValid(linkedStudentId)) {
      student = await users.findOne({
        _id: new ObjectId(linkedStudentId),
        role: "student",
        isDeleted: { $ne: true }
      });
    }

    if (!student && linkedStudentFirebaseUid) {
      student = await users.findOne({
        firebaseUid: linkedStudentFirebaseUid,
        role: "student",
        isDeleted: { $ne: true }
      });
    }

    if (!student && linkedStudentEmail) {
      student = await users.findOne({
        email: linkedStudentEmail,
        role: "student",
        isDeleted: { $ne: true }
      });
    }

    if (!student && linkedStudentName) {
      student = await users.findOne({
        name: { $regex: `^${linkedStudentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
        role: "student",
        isDeleted: { $ne: true }
      });
    }

    if (!student) {
      return jsonResponse({ message: "No student found for the given link details." }, 404);
    }

    const currentRoleDetails = extractRoleDetails(parent.identity.roleDetails);
    const nextRoleDetails: Record<string, unknown> = {
      ...currentRoleDetails,
      linkedStudentId: student._id.toString(),
      linkedStudentFirebaseUid: String(student.firebaseUid ?? ""),
      linkedStudentEmail: String(student.email ?? "").toLowerCase(),
      linkedStudentName: String(student.name ?? "")
    };

    const parentFilter = ObjectId.isValid(parent.identity.userId)
      ? { _id: new ObjectId(parent.identity.userId) }
      : { firebaseUid: parent.identity.firebaseUid };
    await users.updateOne(parentFilter, { $set: { roleDetails: nextRoleDetails, updatedAt: new Date() } });

    invalidateSessionUserCache({
      uid: parent.identity.firebaseUid,
      email: parent.identity.email
    });

    return jsonResponse({
      message: "Student linked successfully.",
      linkedStudent: {
        _id: student._id.toString(),
        firebaseUid: String(student.firebaseUid ?? ""),
        email: String(student.email ?? ""),
        name: String(student.name ?? "Student"),
        linkSource: "id"
      }
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(
        { message: "Database temporarily unavailable. Please try again later.", code: "MongoUnavailable" },
        503
      );
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  const parent = await requireParentIdentity(request);
  if ("error" in parent) return parent.error;

  if (isDemoMode()) {
    return jsonResponse({ message: "Student link removed." });
  }

  try {
    const database = await getMongoDatabase();
    const users = database.collection<UserDoc>("users");
    const currentRoleDetails = extractRoleDetails(parent.identity.roleDetails);
    const nextRoleDetails: Record<string, unknown> = { ...currentRoleDetails };

    delete nextRoleDetails.linkedStudentId;
    delete nextRoleDetails.linkedStudentFirebaseUid;
    delete nextRoleDetails.linkedStudentEmail;
    delete nextRoleDetails.linkedStudentName;

    const parentFilter = ObjectId.isValid(parent.identity.userId)
      ? { _id: new ObjectId(parent.identity.userId) }
      : { firebaseUid: parent.identity.firebaseUid };
    await users.updateOne(parentFilter, { $set: { roleDetails: nextRoleDetails, updatedAt: new Date() } });

    invalidateSessionUserCache({
      uid: parent.identity.firebaseUid,
      email: parent.identity.email
    });

    return jsonResponse({ message: "Student link removed." });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(
        { message: "Database temporarily unavailable. Please try again later.", code: "MongoUnavailable" },
        503
      );
    }
    throw error;
  }
}

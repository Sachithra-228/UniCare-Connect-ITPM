import { Db, ObjectId } from "mongodb";

type UserDoc = {
  _id: ObjectId;
  email?: string;
  name?: string;
  role?: string;
  firebaseUid?: string;
  roleDetails?: Record<string, unknown>;
  isDeleted?: boolean;
  status?: string;
};

export type ParentLinkedStudent = {
  _id: string;
  firebaseUid?: string;
  email?: string;
  name?: string;
  university?: string;
  roleDetails?: Record<string, unknown>;
  linkSource: "id" | "firebase" | "email" | "name" | "none";
};

function normalize(value: unknown) {
  return String(value ?? "").trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractParentLinkHints(roleDetails?: Record<string, unknown>) {
  const details = roleDetails ?? {};
  return {
    linkedStudentId: normalize(details.linkedStudentId),
    linkedStudentFirebaseUid: normalize(details.linkedStudentFirebaseUid),
    linkedStudentEmail: normalize(details.linkedStudentEmail).toLowerCase(),
    linkedStudentName: normalize(details.linkedStudentName || details.fieldA)
  };
}

function mapStudent(document: UserDoc, source: ParentLinkedStudent["linkSource"]): ParentLinkedStudent {
  return {
    _id: document._id.toString(),
    firebaseUid: normalize(document.firebaseUid) || undefined,
    email: normalize(document.email) || undefined,
    name: normalize(document.name) || "Student",
    university: normalize(document.roleDetails?.fieldA) || undefined,
    roleDetails: document.roleDetails,
    linkSource: source
  };
}

export async function resolveParentLinkedStudent(database: Db, roleDetails?: Record<string, unknown>) {
  const users = database.collection<UserDoc>("users");
  const hints = extractParentLinkHints(roleDetails);

  if (hints.linkedStudentId && ObjectId.isValid(hints.linkedStudentId)) {
    const student = await users.findOne({
      _id: new ObjectId(hints.linkedStudentId),
      role: "student",
      isDeleted: { $ne: true }
    });
    if (student) return mapStudent(student, "id");
  }

  if (hints.linkedStudentFirebaseUid) {
    const student = await users.findOne({
      firebaseUid: hints.linkedStudentFirebaseUid,
      role: "student",
      isDeleted: { $ne: true }
    });
    if (student) return mapStudent(student, "firebase");
  }

  if (hints.linkedStudentEmail) {
    const student = await users.findOne({
      email: hints.linkedStudentEmail,
      role: "student",
      isDeleted: { $ne: true }
    });
    if (student) return mapStudent(student, "email");
  }

  if (hints.linkedStudentName) {
    const exactName = new RegExp(`^${escapeRegex(hints.linkedStudentName)}$`, "i");
    const student = await users.findOne(
      {
        name: exactName,
        role: "student",
        isDeleted: { $ne: true }
      },
      { sort: { updatedAt: -1, createdAt: -1 } }
    );
    if (student) return mapStudent(student, "name");
  }

  return null;
}


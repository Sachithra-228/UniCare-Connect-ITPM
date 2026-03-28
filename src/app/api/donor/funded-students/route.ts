import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getDemoDonorFundedStudentsOverview } from "@/lib/donor-funded-students-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type AidRequestDocument = {
  _id?: { toString: () => string };
  userId?: string;
  firebaseUid?: string;
  category?: string;
  amount?: string | number;
  status?: string;
  approvedAt?: Date | string;
  updatedAt?: Date | string;
  createdAt?: Date | string;
  donorConsent?: boolean | string;
  shareWithDonor?: boolean | string;
  profileShareConsent?: boolean | string;
};

type UserDocument = {
  _id?: { toString: () => string };
  firebaseUid?: string;
  name?: string;
  email?: string;
  university?: string;
  roleDetails?: Record<string, unknown>;
};

type ApplicationDocument = {
  userId?: string;
  firebaseUid?: string;
  status?: string;
  updatedAt?: Date | string;
};

function toObjectId(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

type AggregateStudent = {
  id: string;
  userId?: string;
  firebaseUid?: string;
  totalFundedLkr: number;
  supportCategories: Set<string>;
  lastUpdatedIso: string;
  latestStatus: string;
  consentFromAid: boolean;
};

function parseAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.trunc(value);
  if (typeof value === "string") {
    const digits = value.replace(/[^\d]/g, "");
    if (!digits) return 0;
    const parsed = Number.parseInt(digits, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return 0;
}

function toIso(value: Date | string | undefined) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value === "string" && value.trim().length) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    return value;
  }
  return new Date().toISOString();
}

function normalizeCategory(value: unknown) {
  const category = String(value ?? "").trim().toLowerCase();
  if (category.includes("emergency")) return "Emergency aid";
  if (category.includes("equipment")) return "Equipment support";
  if (category.includes("meal") || category.includes("voucher") || category.includes("boarding")) {
    return "Meal voucher support";
  }
  if (category.includes("tuition") || category.includes("fee")) return "Tuition support";
  if (!category) return "General support";
  return String(value ?? "").trim();
}

function approvedStatus(value: unknown) {
  const status = String(value ?? "").trim().toLowerCase();
  return status === "approved";
}

function isTruthyConsent(value: unknown) {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  return ["true", "yes", "consented", "allowed", "1"].includes(text);
}

function hasDonorConsent(user: UserDocument | undefined, aidConsent: boolean) {
  if (aidConsent) return true;
  const details = user?.roleDetails ?? {};
  return (
    isTruthyConsent(details.shareWithDonors) ||
    isTruthyConsent(details.shareProgressWithDonors) ||
    isTruthyConsent(details.donorConsent) ||
    isTruthyConsent(details.profileShareConsent)
  );
}

function progressLabel(score: number) {
  if (score >= 80) return "Strong momentum";
  if (score >= 65) return "On track";
  if (score >= 45) return "Improving";
  return "Needs support";
}

function anonymizedName(identity: string, index: number) {
  const suffix = identity.slice(-4).toUpperCase().padStart(4, "0");
  return `Student #${suffix || String(index + 1).padStart(4, "0")}`;
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  if (isDemoMode()) {
    return jsonResponse(getDemoDonorFundedStudentsOverview());
  }

  try {
    const database = await getMongoDatabase();
    const approvedAid = await database
      .collection<AidRequestDocument>("aid_requests")
      .find({ status: { $in: ["Approved", "approved"] } })
      .sort({ updatedAt: -1, approvedAt: -1, createdAt: -1 })
      .toArray();

    const aggregate = new Map<string, AggregateStudent>();
    approvedAid.forEach((item) => {
      if (!approvedStatus(item.status)) return;
      const userId = String(item.userId ?? "").trim();
      const firebaseUid = String(item.firebaseUid ?? "").trim();
      const identity = userId || firebaseUid;
      if (!identity) return;

      const amount = parseAmount(item.amount);
      const category = normalizeCategory(item.category);
      const updatedIso = toIso(item.updatedAt ?? item.approvedAt ?? item.createdAt);
      const consentFromAid =
        isTruthyConsent(item.donorConsent) ||
        isTruthyConsent(item.shareWithDonor) ||
        isTruthyConsent(item.profileShareConsent);

      const current = aggregate.get(identity);
      if (!current) {
        aggregate.set(identity, {
          id: identity,
          userId: userId || undefined,
          firebaseUid: firebaseUid || undefined,
          totalFundedLkr: amount,
          supportCategories: new Set([category]),
          lastUpdatedIso: updatedIso,
          latestStatus: "Active",
          consentFromAid
        });
      } else {
        current.totalFundedLkr += amount;
        current.supportCategories.add(category);
        if (current.lastUpdatedIso < updatedIso) current.lastUpdatedIso = updatedIso;
        current.consentFromAid = current.consentFromAid || consentFromAid;
      }
    });

    const identities = Array.from(aggregate.values());
    const userIds = identities.map((item) => item.userId).filter(Boolean) as string[];
    const firebaseUids = identities.map((item) => item.firebaseUid).filter(Boolean) as string[];
    const userObjectIds = userIds.map(toObjectId).filter((item): item is ObjectId => item !== null);
    const userClauses: Array<Record<string, unknown>> = [];
    if (userObjectIds.length) userClauses.push({ _id: { $in: userObjectIds } });
    if (firebaseUids.length) userClauses.push({ firebaseUid: { $in: firebaseUids } });

    const [users, applications] = await Promise.all([
      userClauses.length
        ? database
            .collection<UserDocument>("users")
            .find(userClauses.length === 1 ? userClauses[0] : { $or: userClauses })
            .toArray()
        : Promise.resolve([] as UserDocument[]),
      identities.length
        ? database
            .collection<ApplicationDocument>("my_applications")
            .find({
              $or: [
                ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
                ...(firebaseUids.length ? [{ firebaseUid: { $in: firebaseUids } }] : [])
              ]
            })
            .toArray()
        : Promise.resolve([] as ApplicationDocument[])
    ]);

    const userByIdentity = new Map<string, UserDocument>();
    users.forEach((user) => {
      const userId = user._id?.toString?.();
      const firebaseUid = String(user.firebaseUid ?? "").trim();
      if (userId) userByIdentity.set(userId, user);
      if (firebaseUid) userByIdentity.set(firebaseUid, user);
    });

    const appStats = new Map<string, { total: number; successful: number; lastUpdated: string }>();
    applications.forEach((app) => {
      const identity = String(app.userId ?? app.firebaseUid ?? "").trim();
      if (!identity) return;
      const current = appStats.get(identity) ?? { total: 0, successful: 0, lastUpdated: "" };
      current.total += 1;
      const status = String(app.status ?? "").trim().toLowerCase();
      if (status === "approved" || status === "completed") current.successful += 1;
      const updatedIso = toIso(app.updatedAt);
      if (current.lastUpdated < updatedIso) current.lastUpdated = updatedIso;
      appStats.set(identity, current);
    });

    const students = identities
      .map((item, index) => {
        const user = userByIdentity.get(item.userId ?? item.firebaseUid ?? item.id);
        const consented = hasDonorConsent(user, item.consentFromAid);
        const stats = appStats.get(item.userId ?? item.firebaseUid ?? item.id) ?? {
          total: 0,
          successful: 0,
          lastUpdated: ""
        };
        const applicationScore = stats.total
          ? Math.round((stats.successful / Math.max(1, stats.total)) * 100)
          : 55;
        const fundingScore = item.totalFundedLkr >= 100000 ? 25 : item.totalFundedLkr >= 50000 ? 20 : 12;
        const progressScore = Math.min(100, Math.max(35, applicationScore + fundingScore));
        const lastUpdated = [item.lastUpdatedIso, stats.lastUpdated]
          .filter(Boolean)
          .sort()
          .reverse()[0] ?? new Date().toISOString();

        const program = consented
          ? String(user?.roleDetails?.degreeProgram ?? user?.roleDetails?.program ?? "").trim()
          : "";
        const year = consented
          ? String(user?.roleDetails?.year ?? user?.roleDetails?.studyYear ?? "").trim()
          : "";
        const milestone =
          stats.successful > 0
            ? "Completed at least one approved support/application milestone."
            : "Support received and currently progressing through requirements.";

        return {
          id: item.id,
          displayName: consented
            ? String(user?.name ?? user?.email ?? anonymizedName(item.id, index)).trim()
            : anonymizedName(item.id, index),
          canViewIdentity: consented,
          university: consented ? String(user?.university ?? "").trim() : undefined,
          program: program || undefined,
          year: year || undefined,
          totalFundedLkr: item.totalFundedLkr,
          supportCategories: Array.from(item.supportCategories),
          progressScore,
          progressLabel: progressLabel(progressScore),
          latestStatus: item.latestStatus,
          lastUpdated,
          recentMilestone: milestone
        };
      })
      .sort((a, b) => b.totalFundedLkr - a.totalFundedLkr);

    const updates = students
      .slice(0, 8)
      .map((student, index) => ({
        id: `upd-${student.id}-${index}`,
        title: "Funding progress update",
        detail: `${student.displayName} currently has LKR ${student.totalFundedLkr} in approved support.`,
        date: student.lastUpdated
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const fundedStudents = students.length;
    const consentedProfiles = students.filter((item) => item.canViewIdentity).length;
    const anonymizedProfiles = fundedStudents - consentedProfiles;
    const totalFundedLkr = students.reduce((sum, item) => sum + item.totalFundedLkr, 0);
    const avgProgressScore = fundedStudents
      ? Math.round(students.reduce((sum, item) => sum + item.progressScore, 0) / fundedStudents)
      : 0;

    return jsonResponse({
      summary: {
        fundedStudents,
        consentedProfiles,
        anonymizedProfiles,
        totalFundedLkr,
        avgProgressScore,
        activeSupportCases: fundedStudents
      },
      students,
      updates
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse(getDemoDonorFundedStudentsOverview());
    }
    throw error;
  }
}

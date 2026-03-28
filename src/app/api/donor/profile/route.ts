import { NextRequest } from "next/server";
import { isDemoMode, isMongoConnectionError, jsonResponse } from "@/lib/api";
import { getDemoDonorProfile, updateDemoDonorProfile } from "@/lib/donor-profile-demo-store";
import { getMongoDatabase } from "@/lib/mongodb";
import { requireRole, requireSession } from "@/lib/session-auth";

type DonorProfilePayload = {
  organizationName?: string;
  logoUrl?: string;
  focusAreas?: string;
  teamAccess?: string;
  contactEmail?: string;
  websiteUrl?: string;
};

type UserDocument = {
  _id?: { toString: () => string };
  firebaseUid?: string;
  roleDetails?: Record<string, unknown>;
};

function normalizeText(value: unknown, max = 160) {
  return String(value ?? "").trim().slice(0, max);
}

export async function GET(request: NextRequest) {
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;

  if (isDemoMode()) {
    return jsonResponse({ profile: getDemoDonorProfile({ userId, firebaseUid }) });
  }

  try {
    const database = await getMongoDatabase();
    const usersCollection = database.collection<UserDocument>("users");
    let user: UserDocument | null = null;
    if (userId) {
      user = await usersCollection.findOne({ _id: userId as unknown as never });
    }
    if (!user && firebaseUid) {
      user = await usersCollection.findOne({ firebaseUid });
    }

    const donorProfile = (user?.roleDetails?.donorProfile ?? {}) as DonorProfilePayload;
    return jsonResponse({
      profile: {
        organizationName: donorProfile.organizationName ?? "",
        logoUrl: donorProfile.logoUrl ?? "",
        focusAreas: donorProfile.focusAreas ?? "",
        teamAccess: donorProfile.teamAccess ?? "Single admin",
        contactEmail: donorProfile.contactEmail ?? authResult.session.user?.email ?? authResult.session.firebase.email ?? "",
        websiteUrl: donorProfile.websiteUrl ?? ""
      }
    });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      return jsonResponse({ profile: getDemoDonorProfile({ userId, firebaseUid }) });
    }
    throw error;
  }
}

export async function PUT(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as DonorProfilePayload;
  const authResult = await requireSession(request);
  if (authResult.error) return authResult.error;
  const roleCheck = requireRole(authResult.session.user?.role, ["donor", "super_admin"]);
  if (roleCheck) return roleCheck;

  const userId = authResult.session.user?._id;
  const firebaseUid = authResult.session.firebase.uid;

  const profile = {
    organizationName: normalizeText(payload.organizationName, 140),
    logoUrl: normalizeText(payload.logoUrl, 300),
    focusAreas: normalizeText(payload.focusAreas, 200),
    teamAccess: normalizeText(payload.teamAccess, 80) || "Single admin",
    contactEmail: normalizeText(payload.contactEmail, 140),
    websiteUrl: normalizeText(payload.websiteUrl, 200)
  };

  if (isDemoMode()) {
    const updated = updateDemoDonorProfile({ userId, firebaseUid }, profile);
    return jsonResponse({ message: "Profile saved.", profile: updated });
  }

  try {
    const database = await getMongoDatabase();
    const usersCollection = database.collection<UserDocument>("users");
    const filter =
      userId ? { _id: userId as unknown as never } : { firebaseUid };

    const existing = await usersCollection.findOne(filter);
    const currentDetails = (existing?.roleDetails ?? {}) as Record<string, unknown>;

    await usersCollection.updateOne(
      filter,
      {
        $set: {
          roleDetails: { ...currentDetails, donorProfile: profile },
          updatedAt: new Date()
        }
      },
      { upsert: false }
    );

    return jsonResponse({ message: "Profile saved.", profile });
  } catch (error) {
    if (isMongoConnectionError(error)) {
      const updated = updateDemoDonorProfile({ userId, firebaseUid }, profile);
      return jsonResponse({ message: "Profile saved.", profile: updated });
    }
    throw error;
  }
}

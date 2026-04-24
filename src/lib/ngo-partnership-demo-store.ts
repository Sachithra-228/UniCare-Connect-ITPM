import type { UserRole } from "@/types";

type PartnershipRecipient = "admin_staff" | "donor_csr";
type PartnershipStatus = "pending" | "in_review" | "accepted" | "declined";

export type NgoPartnershipRequest = {
  _id: string;
  ngoUserId?: string;
  ngoFirebaseUid?: string;
  ngoName: string;
  title: string;
  description: string;
  focusArea: string;
  recipients: PartnershipRecipient[];
  status: PartnershipStatus;
  responseNote?: string;
  createdAt: string;
  updatedAt: string;
};

type Identity = {
  userId?: string;
  firebaseUid?: string;
  role?: UserRole;
};

let requests: NgoPartnershipRequest[] = [];

function nowIso() {
  return new Date().toISOString();
}

function buildId() {
  return `ngo-partnership-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function isOwner(item: NgoPartnershipRequest, identity: Identity) {
  const userMatch =
    identity.userId && item.ngoUserId && identity.userId === item.ngoUserId;
  const firebaseMatch =
    identity.firebaseUid &&
    item.ngoFirebaseUid &&
    identity.firebaseUid === item.ngoFirebaseUid;
  return Boolean(userMatch || firebaseMatch);
}

function canReceive(item: NgoPartnershipRequest, role?: UserRole) {
  if (!role) return false;
  const isAdmin = role === "admin" || role === "faculty" || role === "super_admin";
  const isDonor = role === "donor";
  if (isAdmin && item.recipients.includes("admin_staff")) return true;
  if (isDonor && item.recipients.includes("donor_csr")) return true;
  return false;
}

export function listDemoNgoPartnershipRequests(identity: Identity) {
  const role = identity.role;
  const isNgoRole = role === "ngo";
  const isPrivilegedRecipient =
    role === "admin" || role === "faculty" || role === "super_admin" || role === "donor";

  return requests
    .filter((item) => {
      if (isNgoRole) return isOwner(item, identity);
      if (isPrivilegedRecipient) return canReceive(item, role);
      return false;
    })
    .map((item) => ({ ...item, recipients: [...item.recipients] }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function createDemoNgoPartnershipRequest(
  identity: Identity,
  input: Omit<
    NgoPartnershipRequest,
    "_id" | "ngoUserId" | "ngoFirebaseUid" | "createdAt" | "updatedAt"
  >
) {
  const now = nowIso();
  const row: NgoPartnershipRequest = {
    _id: buildId(),
    ngoUserId: identity.userId,
    ngoFirebaseUid: identity.firebaseUid,
    ...input,
    createdAt: now,
    updatedAt: now
  };
  requests = [row, ...requests];
  return { ...row, recipients: [...row.recipients] };
}

export function updateDemoNgoPartnershipRequest(
  identity: Identity,
  id: string,
  patch: Partial<
    Omit<NgoPartnershipRequest, "_id" | "ngoUserId" | "ngoFirebaseUid" | "createdAt">
  >
) {
  const index = requests.findIndex((item) => item._id === id);
  if (index < 0) return null;
  const item = requests[index];

  const role = identity.role;
  const ngoCanUpdate = role === "ngo" && isOwner(item, identity);
  const recipientCanUpdate =
    (role === "admin" || role === "faculty" || role === "super_admin" || role === "donor") &&
    canReceive(item, role);
  if (!ngoCanUpdate && !recipientCanUpdate) return null;

  const next: NgoPartnershipRequest = {
    ...item,
    ...patch,
    updatedAt: nowIso()
  };
  requests[index] = next;
  return { ...next, recipients: [...next.recipients] };
}

export function deleteDemoNgoPartnershipRequest(identity: Identity, id: string) {
  const before = requests.length;
  requests = requests.filter((item) => {
    if (item._id !== id) return true;
    return !(identity.role === "ngo" && isOwner(item, identity));
  });
  return requests.length !== before;
}

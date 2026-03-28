export type DemoDonorProfile = {
  organizationName: string;
  logoUrl: string;
  focusAreas: string;
  teamAccess: string;
  contactEmail: string;
  websiteUrl: string;
};

type ProfileInput = Partial<DemoDonorProfile>;

const defaultProfile: DemoDonorProfile = {
  organizationName: "Demo Donor Foundation",
  logoUrl: "",
  focusAreas: "STEM access, first-gen students",
  teamAccess: "Single admin",
  contactEmail: "donor@example.com",
  websiteUrl: ""
};

const profileStore = new Map<string, DemoDonorProfile>();

function keyFor(input: { userId?: string; firebaseUid?: string }) {
  return input.userId || input.firebaseUid || "demo-donor";
}

export function getDemoDonorProfile(input: { userId?: string; firebaseUid?: string }) {
  const key = keyFor(input);
  if (!profileStore.has(key)) {
    profileStore.set(key, { ...defaultProfile });
  }
  return { ...profileStore.get(key)! };
}

export function updateDemoDonorProfile(
  input: { userId?: string; firebaseUid?: string },
  payload: ProfileInput
) {
  const key = keyFor(input);
  const current = getDemoDonorProfile(input);
  const next: DemoDonorProfile = {
    ...current,
    ...payload
  };
  profileStore.set(key, next);
  return { ...next };
}

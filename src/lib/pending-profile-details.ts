export const PENDING_PROFILE_DETAILS_KEY = "jval-pending-profile-details";

export type PendingProfileDetails = {
  email?: string;
  phoneNumber?: string;
  address?: string;
};

export function cleanPendingProfileDetails(details: PendingProfileDetails) {
  const email = cleanString(details.email, 120);
  const phoneNumber = cleanString(details.phoneNumber, 30);
  const address = cleanString(details.address, 180);

  return {
    ...(email ? { email } : {}),
    ...(phoneNumber ? { phoneNumber } : {}),
    ...(address ? { address } : {}),
  };
}

export function savePendingProfileDetails(details: PendingProfileDetails) {
  if (typeof window === "undefined") return;

  const cleanDetails = cleanPendingProfileDetails(details);

  if (!Object.keys(cleanDetails).length) {
    window.localStorage.removeItem(PENDING_PROFILE_DETAILS_KEY);
    return;
  }

  window.localStorage.setItem(
    PENDING_PROFILE_DETAILS_KEY,
    JSON.stringify(cleanDetails),
  );
}

export function readPendingProfileDetails() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PENDING_PROFILE_DETAILS_KEY);
    const parsed = raw ? (JSON.parse(raw) as PendingProfileDetails) : null;

    return parsed ? cleanPendingProfileDetails(parsed) : null;
  } catch {
    return null;
  }
}

export function clearPendingProfileDetails() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PENDING_PROFILE_DETAILS_KEY);
}

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength).trim();
}

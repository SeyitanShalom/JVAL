export type AdminRole = "admin" | "super-admin";

export type AdminPermission =
  | "viewAdmin"
  | "manageContent"
  | "manageTeams"
  | "manageMatchOperations"
  | "manageTournamentStructure"
  | "manageStatistics"
  | "manageSettings"
  | "deleteCriticalData"
  | "uploadImages";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Admin",
  "super-admin": "Super Admin",
};

export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  admin: [
    "viewAdmin",
    "manageContent",
    "manageTeams",
    "manageMatchOperations",
    "uploadImages",
  ],
  "super-admin": [
    "viewAdmin",
    "manageContent",
    "manageTeams",
    "manageMatchOperations",
    "manageTournamentStructure",
    "manageStatistics",
    "manageSettings",
    "deleteCriticalData",
    "uploadImages",
  ],
};

export function isAdminRole(role: unknown): role is AdminRole {
  return role === "admin" || role === "super-admin";
}

export function normalizeAdminRole(role: unknown): AdminRole | null {
  if (role === "admin" || role === "super-admin") {
    return role;
  }

  if (role === "developer") {
    return "super-admin";
  }

  return null;
}

export function hasAdminPermission(
  role: AdminRole,
  permission: AdminPermission,
) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export type AdminRole = "admin" | "developer";

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
  developer: "Developer",
};

export const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  admin: [
    "viewAdmin",
    "manageContent",
    "manageTeams",
    "manageMatchOperations",
    "uploadImages",
  ],
  developer: [
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
  return role === "admin" || role === "developer";
}

export function hasAdminPermission(
  role: AdminRole,
  permission: AdminPermission,
) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAccessSite(maintenanceEnabled: boolean, isAdmin: boolean, pathname: string) {
  return !maintenanceEnabled || isAdmin || pathname === "/auth" || pathname === "/reset-password";
}
export function canAccessSite(maintenanceEnabled: boolean, isAdmin: boolean, pathname: string) {
  return !maintenanceEnabled || isAdmin || pathname === "/auth" || pathname === "/reset-password";
}

/**
 * The Buy projects store stays locked until it is opened from the admin panel.
 * Administrators can always open it to review the listing before launch.
 */
export function canOpenPremade(premadeEnabled: boolean, isAdmin: boolean) {
  return premadeEnabled || isAdmin;
}
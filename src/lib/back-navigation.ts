/** Never leave the app when a workspace page has no tracked previous entry. */
export function getBackAction(canGoBack: boolean, pathname: string) {
  if (canGoBack) return "history";
  return pathname === "/welcome" ? "none" : "workspace";
}
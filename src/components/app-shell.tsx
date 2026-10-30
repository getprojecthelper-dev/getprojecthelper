import { Link, useCanGoBack, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import brandMark from "@/assets/mentor-mark.png";
import { CreditChip } from "@/components/credit-chip";
import { LowCreditsBanner } from "@/components/low-credits-banner";
import { MaterialIcon } from "@/components/material-icon";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { Button } from "@/components/ui/button";
import { signOutAndRedirect } from "@/lib/sign-out";
import { getBackAction } from "@/lib/back-navigation";

/**
 * Compact workspace chrome shared by every signed-in page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const canGoBack = useCanGoBack();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const backAction = getBackAction(canGoBack, pathname);
  return (
    <div className="workspace-canvas min-h-screen w-full">
      <header className="workspace-topbar sticky top-0 z-30 border-b backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back"
              title={backAction === "workspace" ? "Back to workspace" : "Previous page"}
              disabled={backAction === "none"}
              onClick={() => {
                if (backAction === "history") router.history.back();
                else if (backAction === "workspace") void navigate({ to: "/welcome", replace: true });
              }}
            >
              <MaterialIcon name="arrow_back" className="text-base" />
            </Button>
            <Link to="/welcome" className="flex min-w-0 items-center gap-2.5 font-display font-semibold">
              <span className="icon-chip h-8 w-8 shrink-0">
                <img src={brandMark} alt="" width={512} height={512} className="h-5 w-5" />
              </span>
              <span className="truncate">Project Helper</span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <CreditChip />
            <Button asChild variant="ghost" size="icon" aria-label="Settings" className="text-muted-foreground hover:text-primary">
              <Link to="/settings"><MaterialIcon name="settings" /></Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Log out"
              className="text-muted-foreground hover:text-primary"
              onClick={() =>
                void signOutAndRedirect(queryClient, () =>
                  navigate({ to: "/auth", replace: true }),
                )
              }
            >
              <MaterialIcon name="logout" />
            </Button>
          </div>
        </div>
      </header>

      <PaymentTestModeBanner />
      <LowCreditsBanner />
      {children}
    </div>
  );
}

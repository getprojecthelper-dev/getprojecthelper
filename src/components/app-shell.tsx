import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import brandMark from "@/assets/mentor-mark.png";
import { CreditChip } from "@/components/credit-chip";
import { LowCreditsBanner } from "@/components/low-credits-banner";
import { MaterialIcon } from "@/components/material-icon";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { Button } from "@/components/ui/button";
import { signOutAndRedirect } from "@/lib/sign-out";
import { peekBackTarget, takeBackTarget } from "@/lib/back-navigation";

/**
 * Compact workspace chrome shared by every signed-in page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const backTarget = peekBackTarget(pathname);
  const isWorkspaceHome = pathname === "/welcome";
  const backAction = isWorkspaceHome ? "landing" : backTarget ? "history" : "workspace";
  return (
    <div className="workspace-canvas min-h-screen w-full">
      <header className="workspace-topbar sticky top-0 z-30 border-b backdrop-blur">
        <div className="workspace-topbar__inner flex h-[4.5rem] w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back"
              title={
                backAction === "landing"
                  ? "Back to homepage"
                  : backAction === "workspace"
                    ? "Back to workspace"
                    : "Previous page"
              }
              className="workspace-topbar__back size-10 rounded-full text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#111] disabled:opacity-35"
              onClick={() => {
                if (isWorkspaceHome) {
                  void navigate({ to: "/", replace: true });
                  return;
                }
                const target = takeBackTarget(pathname);
                if (target) void navigate({ to: target as never });
                else void navigate({ to: "/welcome", replace: true });
              }}
            >
              <MaterialIcon name="arrow_back" className="text-base" />
            </Button>
            <Link
              to="/welcome"
              className="workspace-topbar__brand flex min-w-0 items-center gap-2.5 rounded-lg font-display font-semibold tracking-[-.035em]"
            >
              <span className="workspace-topbar__mark icon-chip h-9 w-9 shrink-0">
                <img src={brandMark} alt="" width={512} height={512} className="h-5 w-5" />
              </span>
              <span className="truncate text-[1.08rem]">Project Helper</span>
            </Link>
          </div>
          <div className="workspace-topbar__actions flex shrink-0 items-center gap-1.5 sm:gap-2">
            <CreditChip />
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Settings"
              className="workspace-topbar__icon-button size-10 rounded-full text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#0866e8]"
            >
              <Link to="/settings">
                <MaterialIcon name="settings" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Log out"
              className="workspace-topbar__icon-button size-10 rounded-full text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#0866e8]"
              onClick={() =>
                void signOutAndRedirect(queryClient, () => navigate({ to: "/auth", replace: true }))
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

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

import brandMark from "@/assets/mentor-mark.png";
import { CreditChip } from "@/components/credit-chip";
import { LowCreditsBanner } from "@/components/low-credits-banner";
import { MaterialIcon } from "@/components/material-icon";
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
  const isProjectOverview = /^\/projects\/[^/]+\/?$/.test(pathname);
  const backAction = backTarget ? "history" : "workspace";
  return (
    <div
      className={`workspace-canvas min-h-screen w-full ${pathname.endsWith("/build") ? "workspace-canvas--build" : ""} ${isProjectOverview ? "workspace-canvas--overview" : ""}`}
    >
      <header className="workspace-topbar sticky top-0 z-30 border-b backdrop-blur">
        <div className="workspace-topbar__inner mx-auto flex h-[4.5rem] w-full max-w-[96rem] items-center justify-between gap-3 px-4 sm:px-7 lg:px-10">
          <div className="workspace-topbar__identity flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back"
              title={backAction === "workspace" ? "Back to workspace" : "Previous page"}
              disabled={isWorkspaceHome && !backTarget}
              className="workspace-topbar__back size-10 rounded-full text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#111] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => {
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
              <span className="workspace-topbar__mark icon-chip h-10 w-10 shrink-0">
                <img src={brandMark} alt="" width={512} height={512} className="h-5 w-5" />
              </span>
              <span className="truncate text-[1.12rem]">Project Helper</span>
            </Link>
          </div>
          <div className="workspace-topbar__actions flex shrink-0 items-center gap-2 sm:gap-3">
            <CreditChip />
            <div className="workspace-topbar__account-tools flex items-center gap-1 rounded-full p-1">
              <Button
                asChild
                variant="ghost"
                size="icon"
                aria-label="Settings"
                className="workspace-topbar__icon-button size-9 rounded-full text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#0866e8]"
              >
                <Link to="/settings">
                  <MaterialIcon name="settings" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Log out"
                className="workspace-topbar__icon-button size-9 rounded-full text-[#52525b] hover:bg-[#f4f4f5] hover:text-[#0866e8]"
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
        </div>
      </header>

      <LowCreditsBanner />
      {children}
    </div>
  );
}

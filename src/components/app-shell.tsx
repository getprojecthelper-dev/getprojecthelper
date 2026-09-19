import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LogOut, Settings } from "lucide-react";
import type { ReactNode } from "react";

import brandMark from "@/assets/mentor-mark.png";
import { CreditChip } from "@/components/credit-chip";
import { LowCreditsBanner } from "@/components/low-credits-banner";
import { PaymentTestModeBanner } from "@/components/payment-test-mode-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { signOutAndRedirect } from "@/lib/sign-out";

/**
 * Compact workspace chrome shared by every signed-in page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return (
    <div className="min-h-screen w-full bg-secondary/30">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link to="/welcome" className="flex min-w-0 items-center gap-2 font-display font-semibold">
            <img src={brandMark} alt="Project Helper" width={512} height={512} className="h-7 w-7 shrink-0" />
            <span className="truncate">Project Helper</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <CreditChip />
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon" aria-label="Settings">
              <Link to="/settings"><Settings className="h-4 w-4" /></Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Log out"
              onClick={() =>
                void signOutAndRedirect(queryClient, () =>
                  navigate({ to: "/auth", replace: true }),
                )
              }
            >
              <LogOut className="h-4 w-4" />
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

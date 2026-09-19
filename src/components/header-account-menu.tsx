import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { signOutAndRedirect } from "@/lib/sign-out";

export function HeaderAccountMenu() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!user) return null;

  const fullName = typeof user.user_metadata?.["full_name"] === "string"
    ? user.user_metadata["full_name"]
    : "";
  const avatarUrl = typeof user.user_metadata?.["avatar_url"] === "string"
    ? user.user_metadata["avatar_url"]
    : "";
  const label = fullName || user.email || "Account";
  const initials = fullName
    ? fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : (user.email?.[0] ?? "U").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 max-w-52 gap-2 px-2 text-hero-ink hover:bg-hero-ink/10 hover:text-hero-ink"
          aria-label="Open profile menu"
        >
          <Avatar className="h-7 w-7 border border-hero-line">
            <AvatarImage src={avatarUrl} alt="" />
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="min-w-0">
          <span className="block truncate">{fullName || "Your profile"}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings"><Settings className="h-4 w-4" />Account settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void signOutAndRedirect(queryClient, () => navigate({ to: "/auth", replace: true }))}
        >
          <LogOut className="h-4 w-4" />Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
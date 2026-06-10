"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { getNavItemsForRole } from "@/lib/constants/navigation";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { getPermissions } from "@/lib/utils/permissions";
import { useDashboardUser } from "@/components/providers/dashboard-user-provider";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
  isMobileDrawer?: boolean;
};

export function Sidebar({
  className,
  onNavigate,
  isMobileDrawer = false,
}: SidebarProps) {
  const user = useDashboardUser();
  const { isAdmin } = getPermissions(user);
  const navItems = getNavItemsForRole(isAdmin);
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const branchLabel =
    user.role === "admin"
      ? "Tüm şubeler"
      : (user.branch_name ?? "Şube atanmamış");

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card",
        sidebarCollapsed ? "w-[72px]" : "w-64",
        className,
      )}
    >
      {!isMobileDrawer ? (
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-border px-4",
            sidebarCollapsed && "justify-center px-2",
          )}
        >
          {sidebarCollapsed ? (
            <span className="text-sm font-bold tracking-tight">T</span>
          ) : (
            <div>
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                TEKODAK
              </p>
              <p className="text-sm font-semibold">OPS</p>
            </div>
          )}
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-1 flex-col py-4",
          isMobileDrawer && "pt-11",
        )}
      >
        <SidebarNav
          items={navItems}
          collapsed={sidebarCollapsed}
          onNavigate={onNavigate}
        />
      </div>

      <div className="mt-auto border-t border-border p-3">
        {!sidebarCollapsed || isMobileDrawer ? (
          <div className={cn("px-2 text-xs text-muted-foreground", !isMobileDrawer && "mb-3")}>
            <p className="font-medium text-foreground">{user.full_name}</p>
            <p>
              {ROLE_LABELS[user.role]} · {branchLabel}
            </p>
          </div>
        ) : null}
        {!isMobileDrawer ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("w-full", sidebarCollapsed && "px-0")}
            onClick={toggleSidebar}
            aria-label={
              sidebarCollapsed ? "Kenar çubuğunu genişlet" : "Kenar çubuğunu daralt"
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <>
                <ChevronLeft className="size-4" />
                <span>Daralt</span>
              </>
            )}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

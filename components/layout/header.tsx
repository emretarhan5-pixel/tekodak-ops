"use client";

import { Menu } from "lucide-react";

import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";

type HeaderProps = {
  initialUnreadCount?: number;
};

export function Header({ initialUnreadCount = 0 }: HeaderProps) {
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Menüyü aç"
      >
        <Menu className="size-5" />
      </Button>

      <div className="hidden min-w-0 md:block">
        <p className="truncate text-sm font-semibold tracking-tight">
          TEKODAK OPS
        </p>
      </div>

      <div className="mx-auto hidden max-w-md flex-1 md:flex">
        <GlobalSearch className="w-full" />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <GlobalSearch variant="mobile" className="md:hidden" />
        <NotificationBell initialUnreadCount={initialUnreadCount} />
        <UserMenu />
      </div>
    </header>
  );
}

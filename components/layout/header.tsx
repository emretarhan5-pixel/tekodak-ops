"use client";

import { Menu, Search } from "lucide-react";

import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            readOnly
            placeholder="Ara… (Cmd+K — yakında)"
            className="h-9 w-full pl-9"
            aria-label="Global arama"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell initialUnreadCount={initialUnreadCount} />
        <UserMenu />
      </div>
    </header>
  );
}

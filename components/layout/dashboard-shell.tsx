"use client";

import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
  initialUnreadCount?: number;
};

export function DashboardShell({
  children,
  initialUnreadCount = 0,
}: DashboardShellProps) {
  const { mobileSidebarOpen, setMobileSidebarOpen, sidebarCollapsed } =
    useUiStore();

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[280px] gap-0 p-0" showCloseButton={false}>
          <Sidebar
            isMobileDrawer
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-col",
          sidebarCollapsed ? "md:ml-[72px]" : "md:ml-64",
        )}
      >
        <Header initialUnreadCount={initialUnreadCount} />
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

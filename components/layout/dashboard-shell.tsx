"use client";

import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui-store";

type DashboardShellProps = {
  children: React.ReactNode;
  initialUnreadCount?: number;
};

export function DashboardShell({
  children,
  initialUnreadCount = 0,
}: DashboardShellProps) {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[280px] gap-0 p-0 [&_[data-slot=sheet-close]]:top-2 [&_[data-slot=sheet-close]]:right-2"
          showCloseButton
        >
          <Sidebar
            isMobileDrawer
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header initialUnreadCount={initialUnreadCount} />
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

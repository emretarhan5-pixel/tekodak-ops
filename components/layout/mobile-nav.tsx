"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import {
  getMobileMoreNavForRole,
  getMobilePrimaryNavForRole,
} from "@/lib/constants/navigation";
import { getPermissions } from "@/lib/utils/permissions";
import { useDashboardUser } from "@/components/providers/dashboard-user-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname() ?? "";
  const user = useDashboardUser();
  const { isAdmin } = getPermissions(user);
  const { mobileMoreOpen, setMobileMoreOpen } = useUiStore();

  const primaryNav = getMobilePrimaryNavForRole(isAdmin);
  const moreItems = getMobileMoreNavForRole(isAdmin);
  const hasMoreMenu = moreItems.length > 0;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="flex items-stretch justify-around">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isMore = item.href === "#more";
            const isActive = isMore
              ? mobileMoreOpen
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

            if (isMore) {
              return (
                <li key="more" className="flex-1">
                  <button
                    type="button"
                    onClick={() => setMobileMoreOpen(true)}
                    className={cn(
                      "flex w-full flex-col items-center gap-1 px-2 py-2 text-[10px] font-medium",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            }

            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2 text-[10px] font-medium",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {hasMoreMenu ? (
        <Sheet open={mobileMoreOpen} onOpenChange={setMobileMoreOpen}>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Menü</SheetTitle>
            </SheetHeader>
            <div className="mt-4 overflow-y-auto pb-8">
              <SidebarNav
                items={moreItems}
                onNavigate={() => setMobileMoreOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
}

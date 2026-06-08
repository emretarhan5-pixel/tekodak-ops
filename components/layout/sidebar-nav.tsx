"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  items: NavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function SidebarNav({
  items,
  collapsed = false,
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex flex-1 flex-col gap-1 px-2">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href.startsWith("/settings") &&
            pathname.startsWith("/settings")) ||
          (item.href !== "/dashboard" &&
            !item.href.startsWith("/settings") &&
            pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? item.label : undefined}
          >
            <Icon className="size-5 shrink-0" />
            {!collapsed ? <span>{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

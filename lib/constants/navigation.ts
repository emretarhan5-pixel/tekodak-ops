import {
  BarChart3,
  Bell,
  FileText,
  Home,
  MoreHorizontal,
  Package,
  Printer,
  Settings,
  Target,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const STAFF_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Servis Talepleri", href: "/service-requests", icon: Wrench },
  { label: "Bildirimler", href: "/notifications", icon: Bell },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Müşteriler", href: "/customers", icon: Users },
  { label: "Cihazlar", href: "/devices", icon: Printer },
  { label: "Sözleşmeler", href: "/contracts", icon: FileText },
  { label: "Servis Talepleri", href: "/service-requests", icon: Wrench },
  { label: "Stok", href: "/stock", icon: Package },
  { label: "Hedefler", href: "/targets", icon: Target },
  { label: "Raporlar", href: "/reports", icon: BarChart3 },
  { label: "Ayarlar", href: "/settings", icon: Settings },
  { label: "Bildirimler", href: "/notifications", icon: Bell },
];

/** @deprecated Use getNavItemsForRole instead */
export const MAIN_NAV_ITEMS: NavItem[] = ADMIN_NAV_ITEMS;

export const STAFF_MOBILE_PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Servis Talepleri", href: "/service-requests", icon: Wrench },
  { label: "Bildirimler", href: "/notifications", icon: Bell },
];

export const ADMIN_MOBILE_PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Servis Talepleri", href: "/service-requests", icon: Wrench },
  { label: "Müşteriler", href: "/customers", icon: Users },
  { label: "Cihazlar", href: "/devices", icon: Printer },
  { label: "Daha Fazla", href: "#more", icon: MoreHorizontal },
];

/** @deprecated Use getMobilePrimaryNavForRole instead */
export const MOBILE_PRIMARY_NAV: NavItem[] = ADMIN_MOBILE_PRIMARY_NAV;

export function getNavItemsForRole(isAdmin: boolean): NavItem[] {
  return isAdmin ? ADMIN_NAV_ITEMS : STAFF_NAV_ITEMS;
}

export function getMobilePrimaryNavForRole(isAdmin: boolean): NavItem[] {
  return isAdmin ? ADMIN_MOBILE_PRIMARY_NAV : STAFF_MOBILE_PRIMARY_NAV;
}

export function getMobileMoreNavForRole(isAdmin: boolean): NavItem[] {
  if (!isAdmin) return [];

  const primaryHrefs = new Set(
    ADMIN_MOBILE_PRIMARY_NAV.map((item) => item.href).filter(
      (href) => href !== "#more",
    ),
  );

  return ADMIN_NAV_ITEMS.filter((item) => !primaryHrefs.has(item.href));
}

export function filterNavForRole(
  items: NavItem[],
  isAdmin: boolean,
): NavItem[] {
  return items.filter((item) => !item.adminOnly || isAdmin);
}

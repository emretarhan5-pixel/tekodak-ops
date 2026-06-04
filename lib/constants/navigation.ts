import {
  BarChart3,
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

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Müşteriler", href: "/customers", icon: Users },
  { label: "Cihazlar", href: "/devices", icon: Printer },
  { label: "Sözleşmeler", href: "/contracts", icon: FileText },
  { label: "İş Emirleri", href: "/work-orders", icon: Wrench },
  { label: "Stok", href: "/stock", icon: Package },
  { label: "Hedefler", href: "/targets", icon: Target },
  { label: "Raporlar", href: "/reports", icon: BarChart3 },
  {
    label: "Ayarlar",
    href: "/settings",
    icon: Settings,
    adminOnly: true,
  },
];

/** Bottom bar on mobile (md and below) */
export const MOBILE_PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "İş Emirleri", href: "/work-orders", icon: Wrench },
  { label: "Müşteriler", href: "/customers", icon: Users },
  { label: "Cihazlar", href: "/devices", icon: Printer },
  { label: "Daha Fazla", href: "#more", icon: MoreHorizontal },
];

export function filterNavForRole(
  items: NavItem[],
  isAdmin: boolean,
): NavItem[] {
  return items.filter((item) => !item.adminOnly || isAdmin);
}

import type { CustomerContractBadge } from "@/lib/api/customers/types";

export const CONTRACT_BADGE_CONFIG: Record<
  CustomerContractBadge,
  { label: string; icon: string; className: string }
> = {
  active: {
    label: "Aktif",
    icon: "✓",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  },
  renewal_soon: {
    label: "Yenileme yakın",
    icon: "⚠️",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  expiring_soon: {
    label: "Çok yakın",
    icon: "🔴",
    className:
      "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  },
  expired: {
    label: "Süresi dolmuş",
    icon: "❌",
    className:
      "border-border bg-muted text-muted-foreground",
  },
  none: {
    label: "Sözleşme yok",
    icon: "—",
    className:
      "border-border bg-muted/60 text-muted-foreground",
  },
};

export const CONTRACT_STATUS_FILTER_OPTIONS: Array<{
  value: CustomerContractBadge;
  label: string;
}> = [
  { value: "active", label: "Aktif" },
  { value: "renewal_soon", label: "Yenileme Yakın" },
  { value: "expired", label: "Süresi Dolmuş" },
  { value: "none", label: "Sözleşmesiz" },
];

import type { StockListItem } from "@/lib/api/stock/types";
import { PART_UNIT_LABELS } from "@/lib/constants/stock-item";

export function stockRowId(item: Pick<StockListItem, "part_id" | "branch_id">) {
  return `${item.part_id}:${item.branch_id}`;
}

export function stockDetailHref(
  partId: string,
  branchId: string,
  options?: { movement?: boolean },
): string {
  const params = new URLSearchParams({ branchId });
  if (options?.movement) {
    params.set("movement", "new");
  }
  return `/stock/${partId}?${params.toString()}`;
}

export function formatStockQuantity(
  quantity: number,
  unit: StockListItem["unit"],
): string {
  const formatted = Number.isInteger(quantity)
    ? quantity.toLocaleString("tr-TR")
    : quantity.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  return `${formatted} ${PART_UNIT_LABELS[unit]}`;
}

export function generateStockPartCode(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 4);
  return `PR-${stamp}${rand}`;
}

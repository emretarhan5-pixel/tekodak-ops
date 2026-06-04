import {
  STOCK_STATUS_LABELS,
  STOCK_STATUS_VARIANTS,
  type StockStatus,
  type StockStatusBadgeVariant,
} from "@/lib/constants/stock-item";

export function resolveStockStatus(
  stockStatus: string | null,
  currentQuantity: number,
): StockStatus {
  if (currentQuantity <= 0) {
    return "critical";
  }
  if (
    stockStatus === "ok" ||
    stockStatus === "warning" ||
    stockStatus === "critical" ||
    stockStatus === "excess"
  ) {
    return stockStatus;
  }
  return "ok";
}

export function getStockStatusLabel(
  status: StockStatus,
  currentQuantity: number,
): string {
  if (currentQuantity <= 0) {
    return "Stokta yok";
  }
  return STOCK_STATUS_LABELS[status];
}

export function getStockStatusVariant(
  status: StockStatus,
  currentQuantity: number,
): StockStatusBadgeVariant {
  if (currentQuantity <= 0) {
    return STOCK_STATUS_VARIANTS.empty;
  }
  return STOCK_STATUS_VARIANTS[status];
}

import {
  mapPartCategoryLabel,
  mapStockRowStatus,
} from "@/lib/api/stock/stock-helpers";
import type { StockListItem } from "@/lib/api/stock/types";
import type { PartCategory, PartUnit } from "@/lib/constants/stock-item";
import type { StockItemFilterInput } from "@/schemas/stock-item";

export type RawCurrentStockRow = {
  part_id: string | null;
  branch_id: string | null;
  part_code: string | null;
  description: string | null;
  branch_name: string | null;
  current_quantity: number | null;
  min_stock: number | null;
  max_stock: number | null;
  stock_status: string | null;
};

export type PartMetaRow = {
  id: string;
  category: PartCategory;
  unit: PartUnit;
};

export function applyStockStatusFilter(
  rows: RawCurrentStockRow[],
  status: StockItemFilterInput["status"],
): RawCurrentStockRow[] {
  if (!status) return rows;

  return rows.filter((row) => {
    const qty = Number(row.current_quantity ?? 0);
    const dbStatus = row.stock_status;

    switch (status) {
      case "empty":
        return qty <= 0;
      case "ok":
        return qty > 0 && dbStatus === "ok";
      case "warning":
        return qty > 0 && dbStatus === "warning";
      case "critical":
        return qty > 0 && dbStatus === "critical";
      case "excess":
        return qty > 0 && dbStatus === "excess";
      default:
        return true;
    }
  });
}

export function mapStockListItem(
  row: RawCurrentStockRow,
  meta: PartMetaRow,
): StockListItem {
  const currentQuantity = Number(row.current_quantity ?? 0);
  const minStock = Number(row.min_stock ?? 0);
  const { stock_status, status_variant } = mapStockRowStatus(
    row.stock_status,
    currentQuantity,
  );

  return {
    part_id: row.part_id!,
    branch_id: row.branch_id!,
    part_code: row.part_code ?? "",
    description: row.description ?? "",
    category: meta.category,
    category_label: mapPartCategoryLabel(meta.category),
    unit: meta.unit,
    branch_name: row.branch_name ?? "",
    current_quantity: currentQuantity,
    min_stock: minStock,
    max_stock: row.max_stock != null ? Number(row.max_stock) : null,
    stock_status,
    status_variant,
  };
}

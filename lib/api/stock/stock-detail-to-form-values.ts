import type { StockItemDetail } from "@/lib/api/stock/types";
import type { StockItemFormValues } from "@/schemas/stock-item";

export function stockDetailToFormValues(
  item: StockItemDetail,
): StockItemFormValues {
  return {
    part_code: item.part_code,
    description: item.description,
    category: item.category,
    brand_id: item.brand_id ?? "",
    unit: item.unit,
    min_stock: item.branch.min_stock,
    branch_id: item.branch.branch_id,
    initial_quantity: 0,
    notes: item.notes ?? "",
  };
}

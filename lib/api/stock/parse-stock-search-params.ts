import {
  PART_CATEGORIES,
  STOCK_LIST_PAGE_SIZE,
  STOCK_STATUS_FILTERS,
} from "@/lib/constants/stock-item";
import {
  stockItemFilterSchema,
  type StockItemFilterInput,
} from "@/schemas/stock-item";

function pickString(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return undefined;
}

export function parseStockSearchParams(
  params: Record<string, string | string[] | undefined>,
): StockItemFilterInput {
  const category = pickString(params, "category");
  const status = pickString(params, "status");

  return stockItemFilterSchema.parse({
    search: pickString(params, "search"),
    branchId: pickString(params, "branchId"),
    category:
      category && (PART_CATEGORIES as readonly string[]).includes(category)
        ? (category as (typeof PART_CATEGORIES)[number])
        : undefined,
    status:
      status && (STOCK_STATUS_FILTERS as readonly string[]).includes(status)
        ? (status as (typeof STOCK_STATUS_FILTERS)[number])
        : undefined,
    page: pickString(params, "page") ?? "1",
    pageSize: pickString(params, "pageSize") ?? String(STOCK_LIST_PAGE_SIZE),
  });
}

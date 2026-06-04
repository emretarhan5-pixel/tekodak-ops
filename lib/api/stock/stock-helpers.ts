import {
  PART_CATEGORY_LABELS,
  type PartCategory,
  type StockStatus,
} from "@/lib/constants/stock-item";
import {
  STOCK_MOVEMENT_KIND_TO_DB,
  type InventoryMovementType,
  type StockMovementKind,
} from "@/lib/constants/stock-movement";
import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import {
  getStockStatusVariant,
  resolveStockStatus,
} from "@/lib/api/stock/stock-status";
import type { StockApiContext } from "@/lib/api/stock/auth";
import { StockApiError } from "@/lib/api/stock/auth";

export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

export async function refreshCurrentStock(
  supabase: AppSupabaseClient,
): Promise<void> {
  const { error } = await supabase.rpc("refresh_current_stock");
  if (error) {
    throw new Error(error.message);
  }
}

export async function assertPartCodeAvailable(
  supabase: AppSupabaseClient,
  partCode: string,
  excludePartId?: string,
): Promise<void> {
  let query = supabase
    .from("parts")
    .select("id")
    .eq("part_code", partCode)
    .is("deleted_at", null);

  if (excludePartId) {
    query = query.neq("id", excludePartId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    throw new StockApiError("Bu ürün kodu zaten kullanılıyor", "FORBIDDEN");
  }
}

export async function getPartBranchQuantity(
  supabase: AppSupabaseClient,
  partId: string,
  branchId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("current_stock")
    .select("current_quantity")
    .eq("part_id", partId)
    .eq("branch_id", branchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Number(data?.current_quantity ?? 0);
}

export async function assertSufficientStock(
  supabase: AppSupabaseClient,
  partId: string,
  branchId: string,
  quantity: number,
): Promise<void> {
  const current = await getPartBranchQuantity(supabase, partId, branchId);
  if (current < quantity) {
    throw new StockApiError(
      `Yetersiz stok. Mevcut: ${current}, istenen: ${quantity}`,
      "FORBIDDEN",
    );
  }
}

export async function validateBranchExists(
  supabase: AppSupabaseClient,
  branchId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("branches")
    .select("id")
    .eq("id", branchId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new StockApiError("Şube bulunamadı", "NOT_FOUND");
  }
}

export async function validateWorkOrderReference(
  ctx: StockApiContext,
  workOrderId: string,
  branchId: string,
): Promise<void> {
  const { data, error } = await ctx.supabase
    .from("work_orders")
    .select("id, branch_id")
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new StockApiError("İş emri bulunamadı", "NOT_FOUND");
  }

  if (data.branch_id !== branchId) {
    throw new StockApiError(
      "İş emri seçilen şube ile eşleşmiyor",
      "FORBIDDEN",
    );
  }
}

export function mapMovementKindToDbType(
  kind: Exclude<StockMovementKind, "transfer">,
): InventoryMovementType {
  return STOCK_MOVEMENT_KIND_TO_DB[kind];
}

export function resolveQuantityChange(
  kind: Exclude<StockMovementKind, "transfer" | "adjustment">,
  quantity: number,
): number {
  if (kind === "in") return quantity;
  if (kind === "out") return -quantity;
  throw new StockApiError("Geçersiz hareket tipi", "FORBIDDEN");
}

export function matchesDateRange(
  isoDate: string,
  dateFrom?: string,
  dateTo?: string,
): boolean {
  const day = isoDate.slice(0, 10);
  if (dateFrom && day < dateFrom) return false;
  if (dateTo && day > dateTo) return false;
  return true;
}

export function mapPartCategoryLabel(category: PartCategory): string {
  return PART_CATEGORY_LABELS[category];
}

export function mapStockRowStatus(
  stockStatus: string | null,
  currentQuantity: number,
): {
  stock_status: StockStatus;
  status_variant: ReturnType<typeof getStockStatusVariant>;
} {
  const stock_status = resolveStockStatus(stockStatus, currentQuantity);
  return {
    stock_status,
    status_variant: getStockStatusVariant(stock_status, currentQuantity),
  };
}

export function isTrackedBranchStockRow(
  minStock: number | null,
  currentQuantity: number,
): boolean {
  return minStock != null || currentQuantity > 0;
}

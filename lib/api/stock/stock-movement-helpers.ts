import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import type { StockApiContext } from "@/lib/api/stock/auth";
import { StockApiError } from "@/lib/api/stock/auth";
import type { StockMovementItem } from "@/lib/api/stock/types";
import type { InventoryMovementType } from "@/lib/constants/stock-movement";

export type RawMovementRow = {
  id: string;
  part_id: string;
  branch_id: string;
  movement_type: InventoryMovementType;
  quantity_change: number;
  reason: string | null;
  notes: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  created_by: string;
  branches: { name: string };
  creator: { full_name: string };
};

export async function mapStockMovementRows(
  supabase: AppSupabaseClient,
  rows: RawMovementRow[],
): Promise<StockMovementItem[]> {
  const workOrderIds = rows
    .filter((row) => row.reference_type === "work_order" && row.reference_id)
    .map((row) => row.reference_id!);

  const workOrderNumbers = new Map<string, string>();
  if (workOrderIds.length > 0) {
    const { data: workOrders, error } = await supabase
      .from("work_orders")
      .select("id, work_order_number")
      .in("id", workOrderIds);

    if (error) {
      throw new Error(error.message);
    }

    for (const wo of workOrders ?? []) {
      workOrderNumbers.set(wo.id, wo.work_order_number);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    part_id: row.part_id,
    branch_id: row.branch_id,
    branch_name: row.branches.name,
    movement_type: row.movement_type,
    quantity_change: Number(row.quantity_change),
    reason: row.reason,
    notes: row.notes,
    reference_type: row.reference_type,
    reference_id: row.reference_id,
    work_order_number:
      row.reference_type === "work_order" && row.reference_id
        ? (workOrderNumbers.get(row.reference_id) ?? null)
        : null,
    created_at: row.created_at,
    created_by: row.created_by,
    created_by_name: row.creator.full_name,
  }));
}

export async function ensurePartExists(
  ctx: StockApiContext,
  partId: string,
): Promise<void> {
  const { data, error } = await ctx.supabase
    .from("parts")
    .select("id")
    .eq("id", partId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new StockApiError("Stok ürünü bulunamadı", "NOT_FOUND");
  }
}

export async function ensurePartBranchStock(
  ctx: StockApiContext,
  partId: string,
  branchId: string,
): Promise<void> {
  const { data, error } = await ctx.supabase
    .from("part_branch_stock")
    .select("id")
    .eq("part_id", partId)
    .eq("branch_id", branchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new StockApiError(
      "Bu ürün seçilen şubede tanımlı değil",
      "NOT_FOUND",
    );
  }
}

/** Transfer hedef şubesinde kayıt yoksa kaynak şubeden min/max kopyalayarak oluşturur. */
export async function ensurePartBranchStockForTransfer(
  ctx: StockApiContext,
  partId: string,
  sourceBranchId: string,
  targetBranchId: string,
): Promise<void> {
  const { data: existing, error: existingError } = await ctx.supabase
    .from("part_branch_stock")
    .select("id")
    .eq("part_id", partId)
    .eq("branch_id", targetBranchId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    return;
  }

  const { data: sourceStock, error: sourceError } = await ctx.supabase
    .from("part_branch_stock")
    .select("min_stock, max_stock")
    .eq("part_id", partId)
    .eq("branch_id", sourceBranchId)
    .maybeSingle();

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  if (!sourceStock) {
    throw new StockApiError(
      "Bu ürün kaynak şubede tanımlı değil",
      "NOT_FOUND",
    );
  }

  const { error: insertError } = await ctx.supabase
    .from("part_branch_stock")
    .insert({
      part_id: partId,
      branch_id: targetBranchId,
      min_stock: sourceStock.min_stock,
      max_stock: sourceStock.max_stock,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

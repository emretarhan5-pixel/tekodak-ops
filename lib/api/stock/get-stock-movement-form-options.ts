"use server";

import {
  getStockApiContext,
  resolveBranchFilter,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import { getPartBranchQuantity } from "@/lib/api/stock/stock-helpers";
import type { StockMovementFormOptions } from "@/lib/api/stock/types";
import type { PartUnit } from "@/lib/constants/stock-item";

const OPEN_WORK_ORDER_STATUSES = [
  "new",
  "assigned",
  "in_progress",
  "on_hold",
] as const;

export async function getStockMovementFormOptions(
  partId: string,
  branchId: string,
): Promise<StockMovementFormOptions> {
  try {
    const ctx = await getStockApiContext();
    const resolvedBranchId = resolveBranchFilter(ctx, branchId) ?? branchId;

    const [partRes, branchesRes, workOrdersRes, currentQuantity] =
      await Promise.all([
        ctx.supabase
          .from("parts")
          .select("id, part_code, description, unit")
          .eq("id", partId)
          .is("deleted_at", null)
          .maybeSingle(),
        ctx.supabase
          .from("branches")
          .select("id, name, code")
          .eq("is_active", true)
          .order("name", { ascending: true }),
        ctx.supabase
          .from("work_orders")
          .select("id, work_order_number, status")
          .eq("branch_id", resolvedBranchId)
          .in("status", [...OPEN_WORK_ORDER_STATUSES])
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(200),
        getPartBranchQuantity(ctx.supabase, partId, resolvedBranchId),
      ]);

    if (partRes.error) {
      throw new Error(partRes.error.message);
    }
    if (branchesRes.error) {
      throw new Error(branchesRes.error.message);
    }
    if (workOrdersRes.error) {
      throw new Error(workOrdersRes.error.message);
    }

    if (!partRes.data) {
      throw new StockApiError("Stok ürünü bulunamadı", "NOT_FOUND");
    }

    const branches = branchesRes.data ?? [];
    const sourceBranch = branches.find((b) => b.id === resolvedBranchId);

    if (!sourceBranch) {
      throw new StockApiError("Şube bulunamadı", "NOT_FOUND");
    }

    return {
      part_id: partRes.data.id,
      part_code: partRes.data.part_code,
      description: partRes.data.description,
      unit: partRes.data.unit as PartUnit,
      branch_id: resolvedBranchId,
      branch_name: sourceBranch.name,
      branch_code: sourceBranch.code,
      current_quantity: currentQuantity,
      target_branches: branches.filter((b) => b.id !== resolvedBranchId),
      work_orders: (workOrdersRes.data ?? []).map((row) => ({
        id: row.id,
        work_order_number: row.work_order_number,
      })),
    };
  } catch (error) {
    if (error instanceof StockApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

"use server";

import {
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import type { WorkOrderPartOption } from "@/lib/api/work-orders/types";
import { isTrackedBranchStockRow } from "@/lib/api/stock/stock-helpers";
import type { PartUnit } from "@/lib/constants/stock-item";

export async function getWorkOrderPartOptions(
  workOrderId: string,
): Promise<WorkOrderPartOption[]> {
  try {
    const ctx = await getWorkOrderApiContext();

    const { data: workOrder, error: woError } = await ctx.supabase
      .from("work_orders")
      .select("id, branch_id")
      .eq("id", workOrderId)
      .is("deleted_at", null)
      .maybeSingle();

    if (woError) {
      throw new Error(woError.message);
    }

    if (!workOrder) {
      throw new WorkOrderApiError("İş emri bulunamadı", "NOT_FOUND");
    }

    const { data: stockRows, error: stockError } = await ctx.supabase
      .from("current_stock")
      .select("part_id, part_code, description, current_quantity, min_stock")
      .eq("branch_id", workOrder.branch_id)
      .order("part_code", { ascending: true });

    if (stockError) {
      throw new Error(stockError.message);
    }

    const trackedRows = (stockRows ?? []).filter(
      (row) =>
        row.part_id &&
        isTrackedBranchStockRow(
          row.min_stock,
          Number(row.current_quantity ?? 0),
        ),
    );

    const partIds = trackedRows.map((row) => row.part_id!);
    const unitByPartId = new Map<string, PartUnit>();

    if (partIds.length > 0) {
      const { data: parts, error: partsError } = await ctx.supabase
        .from("parts")
        .select("id, unit")
        .in("id", partIds)
        .is("deleted_at", null);

      if (partsError) {
        throw new Error(partsError.message);
      }

      for (const part of parts ?? []) {
        unitByPartId.set(part.id, part.unit as PartUnit);
      }
    }

    return trackedRows.map((row) => ({
      part_id: row.part_id!,
      part_code: row.part_code ?? "",
      description: row.description ?? "",
      unit: unitByPartId.get(row.part_id!) ?? "piece",
      current_quantity: Number(row.current_quantity ?? 0),
    }));
  } catch (error) {
    if (error instanceof WorkOrderApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

"use server";

import {
  getServiceRequestApiContext,
  toActionError,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";
import { loadServiceRequestOrThrow } from "@/lib/api/service-requests/service-request-helpers";
import type { ServiceRequestPartOption } from "@/lib/api/service-requests/types";
import { isTrackedBranchStockRow } from "@/lib/api/stock/stock-helpers";
import type { PartUnit } from "@/lib/constants/stock-item";

export async function getServiceRequestPartOptions(
  serviceRequestId: string,
): Promise<ServiceRequestPartOption[]> {
  try {
    const ctx = await getServiceRequestApiContext();
    const row = await loadServiceRequestOrThrow(ctx, serviceRequestId);

    const { data: stockRows, error: stockError } = await ctx.supabase
      .from("current_stock")
      .select("part_id, part_code, description, current_quantity, min_stock")
      .eq("branch_id", row.branch_id)
      .order("part_code", { ascending: true });

    if (stockError) {
      throw new Error(stockError.message);
    }

    const trackedRows = (stockRows ?? []).filter(
      (stockRow) =>
        stockRow.part_id &&
        isTrackedBranchStockRow(
          stockRow.min_stock,
          Number(stockRow.current_quantity ?? 0),
        ),
    );

    const partIds = trackedRows.map((stockRow) => stockRow.part_id!);
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

    return trackedRows.map((stockRow) => ({
      part_id: stockRow.part_id!,
      part_code: stockRow.part_code ?? "",
      description: stockRow.description ?? "",
      unit: unitByPartId.get(stockRow.part_id!) ?? "piece",
      current_quantity: Number(stockRow.current_quantity ?? 0),
    }));
  } catch (error) {
    if (error instanceof ServiceRequestApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

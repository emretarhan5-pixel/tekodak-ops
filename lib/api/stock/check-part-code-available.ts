"use server";

import {
  getStockApiContext,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import { assertPartCodeAvailable } from "@/lib/api/stock/stock-helpers";

export async function checkPartCodeAvailable(
  partCode: string,
  excludePartId?: string,
): Promise<{ available: boolean; message?: string }> {
  try {
    const normalized = partCode.trim().toUpperCase();
    if (!normalized) {
      return { available: true };
    }

    const ctx = await getStockApiContext();

    try {
      await assertPartCodeAvailable(ctx.supabase, normalized, excludePartId);
      return { available: true };
    } catch (error) {
      if (error instanceof StockApiError) {
        return { available: false, message: error.message };
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof StockApiError) {
      return { available: false, message: error.message };
    }
    return { available: false, message: toActionError(error) };
  }
}

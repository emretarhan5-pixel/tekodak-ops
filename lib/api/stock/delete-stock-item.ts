"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanDelete,
  getStockApiContext,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import type { ActionResult } from "@/lib/api/stock/types";
import { refreshCurrentStock } from "@/lib/api/stock/stock-helpers";
import { getStockItemDeletionImpact } from "@/lib/api/stock/get-stock-item-deletion-impact";

export async function deleteStockItem(
  partId: string,
): Promise<ActionResult<{ partId: string; hadMovements: boolean }>> {
  try {
    const ctx = await getStockApiContext();
    assertCanDelete(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("parts")
      .select("id")
      .eq("id", partId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!existing) {
      throw new StockApiError("Stok ürünü bulunamadı", "NOT_FOUND");
    }

    const impact = await getStockItemDeletionImpact(partId);
    const hadMovements = impact.movementCount > 0;

    const { error: updateError } = await ctx.supabase
      .from("parts")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: ctx.user.id,
        updated_by: ctx.user.id,
      })
      .eq("id", partId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await refreshCurrentStock(ctx.supabase);

    revalidatePath("/stock");
    revalidatePath(`/stock/${partId}`);

    return {
      success: true,
      data: { partId, hadMovements },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

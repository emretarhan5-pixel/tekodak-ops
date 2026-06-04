"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getStockApiContext,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import type { ActionResult } from "@/lib/api/stock/types";
import {
  assertPartCodeAvailable,
  emptyToNull,
  refreshCurrentStock,
  validateBranchExists,
} from "@/lib/api/stock/stock-helpers";
import {
  updateStockItemSchema,
  type UpdateStockItemInput,
} from "@/schemas/stock-item";

export async function updateStockItem(
  rawInput: UpdateStockItemInput,
): Promise<ActionResult<{ partId: string; branchId: string }>> {
  try {
    const input = updateStockItemSchema.parse(rawInput);
    const ctx = await getStockApiContext();
    assertCanEdit(ctx);
    assertCanAccessBranch(ctx, input.branch_id);
    await validateBranchExists(ctx.supabase, input.branch_id);
    await assertPartCodeAvailable(ctx.supabase, input.part_code, input.part_id);

    const { data: existing, error: existingError } = await ctx.supabase
      .from("parts")
      .select("id")
      .eq("id", input.part_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (!existing) {
      throw new StockApiError("Stok ürünü bulunamadı", "NOT_FOUND");
    }

    const { error: partError } = await ctx.supabase
      .from("parts")
      .update({
        part_code: input.part_code,
        description: input.description,
        category: input.category,
        unit: input.unit,
        brand_id: input.brand_id,
        list_price: input.list_price ?? null,
        minimum_price: input.minimum_price ?? null,
        unit_cost: input.unit_cost ?? null,
        supplier_name: emptyToNull(input.supplier_name),
        supplier_code: emptyToNull(input.supplier_code),
        notes: emptyToNull(input.notes),
        updated_by: ctx.user.id,
      })
      .eq("id", input.part_id);

    if (partError) {
      throw new Error(partError.message);
    }

    const { data: branchStock, error: branchStockLoadError } = await ctx.supabase
      .from("part_branch_stock")
      .select("id")
      .eq("part_id", input.part_id)
      .eq("branch_id", input.branch_id)
      .maybeSingle();

    if (branchStockLoadError) {
      throw new Error(branchStockLoadError.message);
    }

    if (branchStock) {
      const { error: branchStockError } = await ctx.supabase
        .from("part_branch_stock")
        .update({
          min_stock: input.min_stock,
          max_stock: input.max_stock ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", branchStock.id);

      if (branchStockError) {
        throw new Error(branchStockError.message);
      }
    } else {
      const { error: branchStockInsertError } = await ctx.supabase
        .from("part_branch_stock")
        .insert({
          part_id: input.part_id,
          branch_id: input.branch_id,
          min_stock: input.min_stock,
          max_stock: input.max_stock ?? null,
        });

      if (branchStockInsertError) {
        throw new Error(branchStockInsertError.message);
      }
    }

    await refreshCurrentStock(ctx.supabase);

    revalidatePath("/stock");
    revalidatePath(`/stock/${input.part_id}`);

    return {
      success: true,
      data: { partId: input.part_id, branchId: input.branch_id },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

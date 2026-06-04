"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getStockApiContext,
  toActionError,
} from "@/lib/api/stock/auth";
import type { ActionResult } from "@/lib/api/stock/types";
import {
  assertPartCodeAvailable,
  emptyToNull,
  refreshCurrentStock,
  validateBranchExists,
} from "@/lib/api/stock/stock-helpers";
import type { TablesInsert } from "@/lib/supabase/types";
import {
  createStockItemSchema,
  type CreateStockItemInput,
} from "@/schemas/stock-item";

export async function createStockItem(
  rawInput: CreateStockItemInput,
): Promise<ActionResult<{ partId: string; branchId: string }>> {
  try {
    const input = createStockItemSchema.parse(rawInput);
    const ctx = await getStockApiContext();
    assertCanEdit(ctx);
    assertCanAccessBranch(ctx, input.branch_id);
    await validateBranchExists(ctx.supabase, input.branch_id);
    await assertPartCodeAvailable(ctx.supabase, input.part_code);

    const partRow: TablesInsert<"parts"> = {
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
      created_by: ctx.user.id,
      updated_by: ctx.user.id,
    };

    const { data: part, error: partError } = await ctx.supabase
      .from("parts")
      .insert(partRow)
      .select("id")
      .single();

    if (partError || !part) {
      throw new Error(partError?.message ?? "Stok ürünü oluşturulamadı");
    }

    const { error: branchStockError } = await ctx.supabase
      .from("part_branch_stock")
      .insert({
        part_id: part.id,
        branch_id: input.branch_id,
        min_stock: input.min_stock,
        max_stock: input.max_stock ?? null,
      });

    if (branchStockError) {
      throw new Error(branchStockError.message);
    }

    if (input.initial_quantity && input.initial_quantity > 0) {
      const movementRow: TablesInsert<"inventory_movements"> = {
        part_id: part.id,
        branch_id: input.branch_id,
        movement_type: "stock_in",
        quantity_change: input.initial_quantity,
        reason: "Başlangıç stoku",
        notes: emptyToNull(input.notes),
        created_by: ctx.user.id,
      };

      const { error: movementError } = await ctx.supabase
        .from("inventory_movements")
        .insert(movementRow);

      if (movementError) {
        throw new Error(movementError.message);
      }
    }

    await refreshCurrentStock(ctx.supabase);

    revalidatePath("/stock");

    return {
      success: true,
      data: { partId: part.id, branchId: input.branch_id },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

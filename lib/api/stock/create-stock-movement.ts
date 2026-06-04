"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getStockApiContext,
  toActionError,
  StockApiError,
} from "@/lib/api/stock/auth";
import { resolveMovementCreatedAt } from "@/lib/api/stock/stock-movement-display";
import type { ActionResult } from "@/lib/api/stock/types";
import {
  assertSufficientStock,
  emptyToNull,
  getPartBranchQuantity,
  mapMovementKindToDbType,
  refreshCurrentStock,
  resolveQuantityChange,
  validateBranchExists,
  validateWorkOrderReference,
} from "@/lib/api/stock/stock-helpers";
import {
  ensurePartBranchStock,
  ensurePartBranchStockForTransfer,
  ensurePartExists,
} from "@/lib/api/stock/stock-movement-helpers";
import type { TablesInsert } from "@/lib/supabase/types";
import {
  createStockMovementSchema,
  type CreateStockMovementInput,
} from "@/schemas/stock-movement";

function movementInsertTimestamps(movementDate?: string | null) {
  const createdAt = resolveMovementCreatedAt(movementDate);
  return createdAt ? { created_at: createdAt } : {};
}

export async function createStockMovement(
  rawInput: CreateStockMovementInput,
): Promise<
  ActionResult<{
    movementId?: string;
    transferId?: string;
    partId: string;
    branchId: string;
  }>
> {
  try {
    const input = createStockMovementSchema.parse(rawInput);
    const ctx = await getStockApiContext();
    assertCanEdit(ctx);
    assertCanAccessBranch(ctx, input.branch_id);
    await validateBranchExists(ctx.supabase, input.branch_id);
    await ensurePartExists(ctx, input.part_id);
    await ensurePartBranchStock(ctx, input.part_id, input.branch_id);

    if (input.work_order_id) {
      await validateWorkOrderReference(
        ctx,
        input.work_order_id,
        input.branch_id,
      );
    }

    const reference =
      input.work_order_id != null
        ? {
            reference_type: "work_order" as const,
            reference_id: input.work_order_id,
          }
        : {
            reference_type: null as string | null,
            reference_id: null as string | null,
          };

    const timestamps = movementInsertTimestamps(input.movement_date);

    if (input.kind === "adjustment") {
      const currentQuantity = await getPartBranchQuantity(
        ctx.supabase,
        input.part_id,
        input.branch_id,
      );
      const delta = input.quantity - currentQuantity;

      if (delta === 0) {
        throw new StockApiError(
          "Sayım sonucu mevcut stok ile aynı; düzeltme gerekmez",
          "FORBIDDEN",
        );
      }

      const movementRow: TablesInsert<"inventory_movements"> = {
        part_id: input.part_id,
        branch_id: input.branch_id,
        movement_type: "adjustment",
        quantity_change: delta,
        reason: `${input.reason} (${currentQuantity} → ${input.quantity})`,
        notes: emptyToNull(input.notes),
        created_by: ctx.user.id,
        ...timestamps,
      };

      const { data: movement, error: movementError } = await ctx.supabase
        .from("inventory_movements")
        .insert(movementRow)
        .select("id")
        .single();

      if (movementError || !movement) {
        throw new Error(movementError?.message ?? "Sayım düzeltmesi kaydedilemedi");
      }

      await refreshCurrentStock(ctx.supabase);

      revalidatePath("/stock");
      revalidatePath(`/stock/${input.part_id}`);

      return {
        success: true,
        data: {
          movementId: movement.id,
          partId: input.part_id,
          branchId: input.branch_id,
        },
      };
    }

    if (input.kind === "transfer") {
      const targetBranchId = input.target_branch_id!;
      await validateBranchExists(ctx.supabase, targetBranchId);
      await assertSufficientStock(
        ctx.supabase,
        input.part_id,
        input.branch_id,
        input.quantity,
      );
      await ensurePartBranchStockForTransfer(
        ctx,
        input.part_id,
        input.branch_id,
        targetBranchId,
      );

      const { data: transfer, error: transferError } = await ctx.supabase
        .from("inventory_transfers")
        .insert({
          source_branch_id: input.branch_id,
          target_branch_id: targetBranchId,
          part_id: input.part_id,
          quantity: input.quantity,
          reason: input.reason,
          status: "approved",
          approved_by: ctx.user.id,
          approved_at: new Date().toISOString(),
          requested_by: ctx.user.id,
        })
        .select("id")
        .single();

      if (transferError || !transfer) {
        throw new Error(transferError?.message ?? "Transfer oluşturulamadı");
      }

      const sourceMovement: TablesInsert<"inventory_movements"> = {
        part_id: input.part_id,
        branch_id: input.branch_id,
        movement_type: "transfer_out",
        quantity_change: -input.quantity,
        reason: input.reason,
        notes: emptyToNull(input.notes),
        reference_type: "inventory_transfer",
        reference_id: transfer.id,
        created_by: ctx.user.id,
        ...timestamps,
      };

      const { data: sourceRow, error: sourceError } = await ctx.supabase
        .from("inventory_movements")
        .insert(sourceMovement)
        .select("id")
        .single();

      if (sourceError || !sourceRow) {
        await ctx.supabase.from("inventory_transfers").delete().eq("id", transfer.id);
        throw new Error(sourceError?.message ?? "Transfer çıkışı kaydedilemedi");
      }

      const targetMovement: TablesInsert<"inventory_movements"> = {
        part_id: input.part_id,
        branch_id: targetBranchId,
        movement_type: "transfer_in",
        quantity_change: input.quantity,
        reason: input.reason,
        notes: emptyToNull(input.notes),
        reference_type: "inventory_transfer",
        reference_id: transfer.id,
        created_by: ctx.user.id,
        ...timestamps,
      };

      const { data: targetRow, error: targetError } = await ctx.supabase
        .from("inventory_movements")
        .insert(targetMovement)
        .select("id")
        .single();

      if (targetError || !targetRow) {
        await ctx.supabase
          .from("inventory_movements")
          .delete()
          .eq("id", sourceRow.id);
        await ctx.supabase.from("inventory_transfers").delete().eq("id", transfer.id);
        throw new Error(targetError?.message ?? "Transfer girişi kaydedilemedi");
      }

      const { error: linkError } = await ctx.supabase
        .from("inventory_transfers")
        .update({
          source_movement_id: sourceRow.id,
          target_movement_id: targetRow.id,
        })
        .eq("id", transfer.id);

      if (linkError) {
        throw new Error(linkError.message);
      }

      await refreshCurrentStock(ctx.supabase);

      revalidatePath("/stock");
      revalidatePath(`/stock/${input.part_id}`);

      return {
        success: true,
        data: {
          transferId: transfer.id,
          movementId: sourceRow.id,
          partId: input.part_id,
          branchId: input.branch_id,
        },
      };
    }

    if (input.kind === "out") {
      await assertSufficientStock(
        ctx.supabase,
        input.part_id,
        input.branch_id,
        input.quantity,
      );
    }

    const movementRow: TablesInsert<"inventory_movements"> = {
      part_id: input.part_id,
      branch_id: input.branch_id,
      movement_type: mapMovementKindToDbType(input.kind),
      quantity_change: resolveQuantityChange(input.kind, input.quantity),
      reason: input.reason,
      notes: emptyToNull(input.notes),
      reference_type: reference.reference_type,
      reference_id: reference.reference_id,
      created_by: ctx.user.id,
      ...timestamps,
    };

    const { data: movement, error: movementError } = await ctx.supabase
      .from("inventory_movements")
      .insert(movementRow)
      .select("id")
      .single();

    if (movementError || !movement) {
      throw new Error(movementError?.message ?? "Stok hareketi kaydedilemedi");
    }

    await refreshCurrentStock(ctx.supabase);

    revalidatePath("/stock");
    revalidatePath(`/stock/${input.part_id}`);

    return {
      success: true,
      data: {
        movementId: movement.id,
        partId: input.part_id,
        branchId: input.branch_id,
      },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

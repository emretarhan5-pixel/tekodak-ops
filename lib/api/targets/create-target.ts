"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getTargetApiContext,
  toActionError,
} from "@/lib/api/targets/auth";
import {
  syncIndividualTargetAssignee,
  validateAssigneeInBranch,
  validateBranchExists,
} from "@/lib/api/targets/target-helpers";
import type { ActionResult } from "@/lib/api/targets/types";
import type { TablesInsert } from "@/lib/supabase/types";
import { createTargetSchema, type CreateTargetInput } from "@/schemas/target";

export async function createTarget(
  rawInput: CreateTargetInput,
): Promise<ActionResult<{ targetId: string }>> {
  try {
    const input = createTargetSchema.parse(rawInput);
    const ctx = await getTargetApiContext();
    assertCanEdit(ctx);
    assertCanAccessBranch(ctx, input.branch_id);
    await validateBranchExists(ctx.supabase, input.branch_id);

    if (input.assigned_user_id) {
      await validateAssigneeInBranch(
        ctx,
        input.branch_id,
        input.assigned_user_id,
      );
    }

    const row: TablesInsert<"targets"> = {
      name: input.name,
      description: input.description,
      branch_id: input.branch_id,
      metric_type: input.metric_type,
      period_type: input.period_type,
      start_date: input.start_date,
      end_date: input.end_date,
      target_value: input.target_value,
      status: input.status,
      has_individual_targets: Boolean(input.assigned_user_id),
      reward_model: "none",
      reward_config:
        input.metric_type === "revenue_contracts" && input.currency
          ? { currency: input.currency }
          : null,
      created_by: ctx.user.id,
    };

    const { data: inserted, error: insertError } = await ctx.supabase
      .from("targets")
      .insert(row)
      .select("id")
      .single();

    if (insertError || !inserted) {
      throw new Error(insertError?.message ?? "Hedef oluşturulamadı");
    }

    if (input.assigned_user_id) {
      await syncIndividualTargetAssignee(
        ctx,
        inserted.id,
        input.target_value,
        input.assigned_user_id,
      );
    }

    revalidatePath("/targets");
    revalidatePath(`/targets/${inserted.id}`);
    revalidatePath("/dashboard");

    return { success: true, data: { targetId: inserted.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

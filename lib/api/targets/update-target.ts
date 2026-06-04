"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getTargetApiContext,
  TargetApiError,
  toActionError,
} from "@/lib/api/targets/auth";
import {
  syncIndividualTargetAssignee,
  validateAssigneeInBranch,
  validateBranchExists,
} from "@/lib/api/targets/target-helpers";
import type { ActionResult } from "@/lib/api/targets/types";
import { updateTargetSchema, type UpdateTargetInput } from "@/schemas/target";

export async function updateTarget(
  rawInput: UpdateTargetInput,
): Promise<ActionResult<{ targetId: string }>> {
  try {
    const input = updateTargetSchema.parse(rawInput);
    const ctx = await getTargetApiContext();
    assertCanEdit(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("targets")
      .select("id, branch_id, status")
      .eq("id", input.id)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!existing) {
      throw new TargetApiError("Hedef bulunamadı", "NOT_FOUND");
    }

    if (existing.status === "cancelled") {
      throw new TargetApiError("İptal edilmiş hedef düzenlenemez", "FORBIDDEN");
    }

    if (!existing.branch_id) {
      throw new TargetApiError("Hedef şubesi tanımlı değil", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, existing.branch_id);
    assertCanAccessBranch(ctx, input.branch_id);
    await validateBranchExists(ctx.supabase, input.branch_id);

    if (input.assigned_user_id) {
      await validateAssigneeInBranch(
        ctx,
        input.branch_id,
        input.assigned_user_id,
      );
    }

    const { error: updateError } = await ctx.supabase
      .from("targets")
      .update({
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
        reward_config:
          input.metric_type === "revenue_contracts" && input.currency
            ? { currency: input.currency }
            : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await syncIndividualTargetAssignee(
      ctx,
      input.id,
      input.target_value,
      input.assigned_user_id,
    );

    revalidatePath("/targets");
    revalidatePath(`/targets/${input.id}`);
    revalidatePath(`/targets/${input.id}/edit`);
    revalidatePath("/dashboard");

    return { success: true, data: { targetId: input.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

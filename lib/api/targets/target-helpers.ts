import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import type { TargetApiContext } from "@/lib/api/targets/auth";
import { TargetApiError } from "@/lib/api/targets/auth";

export async function validateBranchExists(
  supabase: AppSupabaseClient,
  branchId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("branches")
    .select("id")
    .eq("id", branchId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new TargetApiError("Şube bulunamadı", "NOT_FOUND");
  }
}

export async function validateAssigneeInBranch(
  ctx: TargetApiContext,
  branchId: string,
  userId: string,
): Promise<void> {
  const { data, error } = await ctx.supabase
    .from("users")
    .select("id, branch_id")
    .eq("id", userId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new TargetApiError("Atanan personel bulunamadı", "NOT_FOUND");
  }

  if (data.branch_id !== branchId) {
    throw new TargetApiError(
      "Atanan personel seçilen şubede değil",
      "FORBIDDEN",
    );
  }
}

export async function syncIndividualTargetAssignee(
  ctx: TargetApiContext,
  targetId: string,
  targetValue: number,
  assignedUserId: string | null,
): Promise<void> {
  const { error: deleteError } = await ctx.supabase
    .from("individual_targets")
    .delete()
    .eq("target_id", targetId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!assignedUserId) {
    const { error: clearFlagError } = await ctx.supabase
      .from("targets")
      .update({ has_individual_targets: false })
      .eq("id", targetId);

    if (clearFlagError) {
      throw new Error(clearFlagError.message);
    }
    return;
  }

  const { error: insertError } = await ctx.supabase
    .from("individual_targets")
    .insert({
      target_id: targetId,
      user_id: assignedUserId,
      individual_value: targetValue,
      assigned_by: ctx.user.id,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { error: setFlagError } = await ctx.supabase
    .from("targets")
    .update({ has_individual_targets: true })
    .eq("id", targetId);

  if (setFlagError) {
    throw new Error(setFlagError.message);
  }
}

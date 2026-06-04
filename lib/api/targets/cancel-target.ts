"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanDelete,
  getTargetApiContext,
  TargetApiError,
  toActionError,
} from "@/lib/api/targets/auth";
import type { ActionResult } from "@/lib/api/targets/types";

export async function cancelTarget(
  targetId: string,
): Promise<ActionResult<{ targetId: string }>> {
  try {
    const ctx = await getTargetApiContext();
    assertCanDelete(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("targets")
      .select("id, branch_id, status")
      .eq("id", targetId)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!existing) {
      throw new TargetApiError("Hedef bulunamadı", "NOT_FOUND");
    }

    if (existing.branch_id) {
      assertCanAccessBranch(ctx, existing.branch_id);
    }

    if (existing.status === "cancelled") {
      return { success: true, data: { targetId } };
    }

    const { error: updateError } = await ctx.supabase
      .from("targets")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath("/targets");
    revalidatePath(`/targets/${targetId}`);
    revalidatePath("/dashboard");

    return { success: true, data: { targetId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

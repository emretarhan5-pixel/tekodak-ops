"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanDelete,
  ContractApiError,
  getContractApiContext,
  toActionError,
} from "@/lib/api/contracts/auth";
import type { ActionResult } from "@/lib/api/contracts/types";

export async function deleteContract(
  contractId: string,
): Promise<ActionResult<{ contractId: string }>> {
  try {
    const ctx = await getContractApiContext();
    assertCanDelete(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("contracts")
      .select("id, customer_id, branch_id")
      .eq("id", contractId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!existing) {
      throw new ContractApiError("Sözleşme bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, existing.branch_id);

    const { error: updateError } = await ctx.supabase
      .from("contracts")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: ctx.user.id,
        updated_by: ctx.user.id,
      })
      .eq("id", contractId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath("/contracts");
    revalidatePath(`/contracts/${contractId}`);
    revalidatePath(`/customers/${existing.customer_id}`);

    return { success: true, data: { contractId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

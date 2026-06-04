"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  ContractApiError,
  getContractApiContext,
  toActionError,
} from "@/lib/api/contracts/auth";
import type { ActionResult } from "@/lib/api/contracts/types";

export async function deleteContractFile(
  fileId: string,
): Promise<ActionResult<{ fileId: string }>> {
  try {
    const ctx = await getContractApiContext();

    const { data: file, error: loadError } = await ctx.supabase
      .from("contract_files")
      .select("id, contract_id, uploaded_by, contracts!inner ( branch_id, deleted_at )")
      .eq("id", fileId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!file) {
      throw new ContractApiError("Dosya bulunamadı", "NOT_FOUND");
    }

    const row = file as typeof file & {
      contracts: { branch_id: string; deleted_at: string | null };
    };

    if (row.contracts.deleted_at) {
      throw new ContractApiError("Sözleşme bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, row.contracts.branch_id);

    const canDelete =
      ctx.permissions.isAdmin || row.uploaded_by === ctx.user.id;

    if (!canDelete) {
      throw new ContractApiError("Bu dosyayı silme yetkiniz yok", "FORBIDDEN");
    }

    const { error: updateError } = await ctx.supabase
      .from("contract_files")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: ctx.user.id,
      })
      .eq("id", fileId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath(`/contracts/${row.contract_id}`);

    return { success: true, data: { fileId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

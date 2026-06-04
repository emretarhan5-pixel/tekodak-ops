"use server";

import {
  assertCanAccessBranch,
  ContractApiError,
  getContractApiContext,
  toActionError,
} from "@/lib/api/contracts/auth";
import type { ActionResult } from "@/lib/api/contracts/types";
import { CONTRACT_FILE_BUCKET } from "@/lib/constants/contract-file";

export async function getContractFileDownloadUrl(
  fileId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const ctx = await getContractApiContext();

    const { data: file, error: loadError } = await ctx.supabase
      .from("contract_files")
      .select(
        `
        id,
        storage_path,
        contracts!inner ( branch_id, deleted_at )
      `,
      )
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

    const { data: signed, error: signError } = await ctx.supabase.storage
      .from(CONTRACT_FILE_BUCKET)
      .createSignedUrl(row.storage_path, 120);

    if (signError || !signed?.signedUrl) {
      return {
        success: false,
        error: signError?.message ?? "İndirme bağlantısı oluşturulamadı",
      };
    }

    return { success: true, data: { url: signed.signedUrl } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

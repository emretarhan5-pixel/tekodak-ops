"use server";

import {
  assertCanAccessBranch,
  ContractApiError,
  getContractApiContext,
  toActionError,
} from "@/lib/api/contracts/auth";
import type { ContractFileRow } from "@/lib/api/contracts/types";

export async function getContractFiles(
  contractId: string,
): Promise<ContractFileRow[]> {
  try {
    const ctx = await getContractApiContext();

    const { data: contract, error: contractError } = await ctx.supabase
      .from("contracts")
      .select("id, branch_id")
      .eq("id", contractId)
      .is("deleted_at", null)
      .maybeSingle();

    if (contractError) {
      throw new Error(contractError.message);
    }

    if (!contract) {
      throw new ContractApiError("Sözleşme bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, contract.branch_id);

    const { data, error } = await ctx.supabase
      .from("contract_files")
      .select(
        `
        id,
        contract_id,
        file_name,
        storage_path,
        file_size_bytes,
        mime_type,
        category,
        description,
        uploaded_at,
        uploaded_by,
        uploader:users!contract_files_uploaded_by_fkey (
          full_name
        )
      `,
      )
      .eq("contract_id", contractId)
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((fileRow) => {
      const typed = fileRow as typeof fileRow & {
        uploader: { full_name: string } | null;
      };
      return {
        id: typed.id,
        contract_id: typed.contract_id,
        file_name: typed.file_name,
        storage_path: typed.storage_path,
        file_size_bytes: typed.file_size_bytes,
        mime_type: typed.mime_type,
        category: typed.category,
        description: typed.description,
        uploaded_at: typed.uploaded_at ?? new Date().toISOString(),
        uploaded_by: typed.uploaded_by,
        uploaded_by_name: typed.uploader?.full_name ?? "—",
      };
    });
  } catch (error) {
    if (error instanceof ContractApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

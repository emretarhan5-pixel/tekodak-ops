"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  assertCanAccessBranch,
  assertCanEdit,
  ContractApiError,
  getContractApiContext,
  toActionError,
} from "@/lib/api/contracts/auth";
import type { ActionResult } from "@/lib/api/contracts/types";
import {
  CONTRACT_FILE_BUCKET,
  CONTRACT_FILE_CATEGORIES,
  CONTRACT_FILE_MAX_BYTES,
  type ContractFileCategory,
} from "@/lib/constants/contract-file";
import { sanitizeFileName } from "@/lib/utils/sanitize-filename";

const categoryValues = CONTRACT_FILE_CATEGORIES.map(
  (c) => c.value,
) as [ContractFileCategory, ...ContractFileCategory[]];

const uploadSchema = z.object({
  contractId: z.string().uuid(),
  category: z.enum(categoryValues),
  description: z.string().max(2000).optional().nullable(),
});

export async function uploadContractFile(
  formData: FormData,
): Promise<ActionResult<{ fileId: string }>> {
  try {
    const ctx = await getContractApiContext();
    assertCanEdit(ctx);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Dosya seçilmedi" };
    }

    if (file.size > CONTRACT_FILE_MAX_BYTES) {
      return {
        success: false,
        error: "Dosya boyutu en fazla 10 MB olabilir",
      };
    }

    const parsed = uploadSchema.parse({
      contractId: formData.get("contractId"),
      category: formData.get("category"),
      description: (formData.get("description") as string) || null,
    });

    const { data: contract, error: contractError } = await ctx.supabase
      .from("contracts")
      .select("id, branch_id")
      .eq("id", parsed.contractId)
      .is("deleted_at", null)
      .maybeSingle();

    if (contractError) {
      throw new Error(contractError.message);
    }

    if (!contract) {
      throw new ContractApiError("Sözleşme bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, contract.branch_id);

    const fileId = crypto.randomUUID();
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${parsed.contractId}/${fileId}/${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await ctx.supabase.storage
      .from(CONTRACT_FILE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message || "Dosya yüklenemedi",
      };
    }

    const description =
      parsed.description?.trim() ? parsed.description.trim() : null;

    const { error: insertError } = await ctx.supabase
      .from("contract_files")
      .insert({
        id: fileId,
        contract_id: parsed.contractId,
        file_name: safeName,
        storage_path: storagePath,
        file_size_bytes: file.size,
        mime_type: file.type || "application/octet-stream",
        category: parsed.category,
        description,
        uploaded_by: ctx.user.id,
      });

    if (insertError) {
      await ctx.supabase.storage.from(CONTRACT_FILE_BUCKET).remove([storagePath]);
      throw new Error(insertError.message);
    }

    revalidatePath(`/contracts/${parsed.contractId}`);

    return { success: true, data: { fileId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

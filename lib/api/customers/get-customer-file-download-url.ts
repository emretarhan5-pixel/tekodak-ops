"use server";

import {
  assertCanAccessBranch,
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import type { ActionResult } from "@/lib/api/customers/types";
import { CUSTOMER_FILE_BUCKET } from "@/lib/constants/customer-file";

export async function getCustomerFileDownloadUrl(
  fileId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const ctx = await getCustomerApiContext();

    const { data: file, error: loadError } = await ctx.supabase
      .from("customer_files")
      .select(
        "id, storage_path, customers!inner ( branch_id, deleted_at )",
      )
      .eq("id", fileId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!file) {
      throw new CustomerApiError("Dosya bulunamadı", "NOT_FOUND");
    }

    const row = file as typeof file & {
      customers: { branch_id: string; deleted_at: string | null };
    };

    if (row.customers.deleted_at) {
      throw new CustomerApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, row.customers.branch_id);

    const { data: signed, error: signError } = await ctx.supabase.storage
      .from(CUSTOMER_FILE_BUCKET)
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

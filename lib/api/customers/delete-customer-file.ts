"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import type { ActionResult } from "@/lib/api/customers/types";

export async function deleteCustomerFile(
  fileId: string,
): Promise<ActionResult<{ fileId: string }>> {
  try {
    const ctx = await getCustomerApiContext();

    const { data: file, error: loadError } = await ctx.supabase
      .from("customer_files")
      .select(
        "id, customer_id, uploaded_by, customers!inner ( branch_id, deleted_at )",
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

    const canDelete =
      ctx.permissions.isAdmin || row.uploaded_by === ctx.user.id;

    if (!canDelete) {
      throw new CustomerApiError(
        "Bu dosyayı silme yetkiniz yok",
        "FORBIDDEN",
      );
    }

    const { error: updateError } = await ctx.supabase
      .from("customer_files")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: ctx.user.id,
      })
      .eq("id", fileId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    revalidatePath(`/customers/${row.customer_id}`);

    return { success: true, data: { fileId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

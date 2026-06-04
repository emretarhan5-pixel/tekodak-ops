"use server";

import {
  assertCanAccessBranch,
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import type { CustomerFileRow } from "@/lib/api/customers/types";

export async function getCustomerFiles(
  customerId: string,
): Promise<CustomerFileRow[]> {
  try {
    const ctx = await getCustomerApiContext();

    const { data: customer, error: customerError } = await ctx.supabase
      .from("customers")
      .select("branch_id")
      .eq("id", customerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (customerError) {
      throw new Error(customerError.message);
    }

    if (!customer) {
      throw new CustomerApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, customer.branch_id);

    const { data, error } = await ctx.supabase
      .from("customer_files")
      .select(
        `
        id,
        customer_id,
        file_name,
        storage_path,
        file_size_bytes,
        mime_type,
        category,
        description,
        uploaded_at,
        uploaded_by,
        uploader:users!customer_files_uploaded_by_fkey (
          full_name
        )
      `,
      )
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => {
      const typed = row as typeof row & {
        uploader: { full_name: string } | null;
      };
      return {
        id: typed.id,
        customer_id: typed.customer_id,
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
    if (error instanceof CustomerApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

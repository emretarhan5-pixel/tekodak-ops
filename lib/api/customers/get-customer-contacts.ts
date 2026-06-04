"use server";

import {
  assertCanAccessBranch,
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import type { CustomerContactRow } from "@/lib/api/customers/types";

async function loadCustomerBranch(
  ctx: Awaited<ReturnType<typeof getCustomerApiContext>>,
  customerId: string,
): Promise<string> {
  const { data, error } = await ctx.supabase
    .from("customers")
    .select("branch_id")
    .eq("id", customerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new CustomerApiError("Müşteri bulunamadı", "NOT_FOUND");
  }

  return data.branch_id;
}

export async function getCustomerContacts(
  customerId: string,
): Promise<CustomerContactRow[]> {
  try {
    const ctx = await getCustomerApiContext();
    const branchId = await loadCustomerBranch(ctx, customerId);
    assertCanAccessBranch(ctx, branchId);

    const { data, error } = await ctx.supabase
      .from("customer_contacts")
      .select(
        "id, customer_id, full_name, title, phone, email, is_primary, notes, created_at",
      )
      .eq("customer_id", customerId)
      .order("is_primary", { ascending: false })
      .order("full_name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as CustomerContactRow[];
  } catch (error) {
    if (error instanceof CustomerApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

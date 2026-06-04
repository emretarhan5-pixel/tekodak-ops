"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanDelete,
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import type { ActionResult } from "@/lib/api/customers/types";

export type CustomerDeletionImpact = {
  activeContracts: number;
  openWorkOrders: number;
};

export async function getCustomerDeletionImpact(
  customerId: string,
): Promise<CustomerDeletionImpact> {
  const ctx = await getCustomerApiContext();
  assertCanDelete(ctx);

  const { data: customer } = await ctx.supabase
    .from("customers")
    .select("branch_id")
    .eq("id", customerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!customer) {
    return { activeContracts: 0, openWorkOrders: 0 };
  }

  assertCanAccessBranch(ctx, customer.branch_id);

  const [contracts, workOrders] = await Promise.all([
    ctx.supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .in("status", ["active", "renewal_approaching", "expiring_soon"])
      .is("deleted_at", null),
    ctx.supabase
      .from("work_orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .in("status", ["new", "assigned", "in_progress", "on_hold"])
      .is("deleted_at", null),
  ]);

  return {
    activeContracts: contracts.count ?? 0,
    openWorkOrders: workOrders.count ?? 0,
  };
}

export async function deleteCustomer(
  customerId: string,
): Promise<ActionResult<{ customerId: string }>> {
  try {
    const ctx = await getCustomerApiContext();
    assertCanDelete(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("customers")
      .select("id, branch_id, name")
      .eq("id", customerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!existing) {
      throw new CustomerApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, existing.branch_id);

    const { error: deleteError } = await ctx.supabase
      .from("customers")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: ctx.user.id,
        updated_by: ctx.user.id,
      })
      .eq("id", customerId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);

    return { success: true, data: { customerId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import type { ActionResult } from "@/lib/api/customers/types";

export async function toggleCustomerPin(
  customerId: string,
): Promise<ActionResult<{ is_pinned: boolean }>> {
  try {
    const ctx = await getCustomerApiContext();

    const { data: customer, error: loadError } = await ctx.supabase
      .from("customers")
      .select("id, branch_id")
      .eq("id", customerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!customer) {
      throw new CustomerApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, customer.branch_id);

    const { data: existingPin } = await ctx.supabase
      .from("customer_pins")
      .select("user_id")
      .eq("customer_id", customerId)
      .eq("user_id", ctx.user.id)
      .maybeSingle();

    if (existingPin) {
      const { error: deleteError } = await ctx.supabase
        .from("customer_pins")
        .delete()
        .eq("customer_id", customerId)
        .eq("user_id", ctx.user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      revalidatePath("/customers");
      revalidatePath(`/customers/${customerId}`);

      return { success: true, data: { is_pinned: false } };
    }

    const { error: insertError } = await ctx.supabase
      .from("customer_pins")
      .insert({
        customer_id: customerId,
        user_id: ctx.user.id,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);

    return { success: true, data: { is_pinned: true } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

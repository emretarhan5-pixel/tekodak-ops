"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import type { ActionResult } from "@/lib/api/customers/types";
import {
  createCustomerSchema,
  type CreateCustomerInput,
} from "@/schemas/customer";

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

export async function createCustomer(
  rawInput: CreateCustomerInput,
): Promise<ActionResult<{ customerId: string }>> {
  try {
    const input = createCustomerSchema.parse(rawInput);
    const ctx = await getCustomerApiContext();
    assertCanEdit(ctx);
    assertCanAccessBranch(ctx, input.branch_id);

    const { data: existingTax } = await ctx.supabase
      .from("customers")
      .select("id")
      .eq("tax_number", input.tax_number)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingTax) {
      return {
        success: false,
        error: "Bu vergi numarası ile kayıtlı bir müşteri zaten var",
      };
    }

    if (input.sector) {
      const { data: sectorRow } = await ctx.supabase
        .from("categories")
        .select("code")
        .eq("category_type", "customer_sector")
        .eq("code", input.sector)
        .eq("is_active", true)
        .maybeSingle();

      if (!sectorRow) {
        return { success: false, error: "Geçersiz sektör seçimi" };
      }
    }

    const { data: customer, error: insertError } = await ctx.supabase
      .from("customers")
      .insert({
        name: input.name,
        tax_office: emptyToNull(input.tax_office),
        tax_number: input.tax_number,
        customer_type: input.customer_type,
        sector: emptyToNull(input.sector),
        main_phone: input.main_phone,
        email: emptyToNull(input.email),
        website: emptyToNull(input.website),
        city: input.city,
        district: emptyToNull(input.district),
        full_address: emptyToNull(input.full_address),
        notes: emptyToNull(input.notes),
        branch_id: input.branch_id,
        created_by: ctx.user.id,
        updated_by: ctx.user.id,
      })
      .select("id")
      .single();

    if (insertError || !customer) {
      if (insertError?.code === "23505") {
        return {
          success: false,
          error: "Bu vergi numarası ile kayıtlı bir müşteri zaten var",
        };
      }
      throw new Error(insertError?.message ?? "Müşteri oluşturulamadı");
    }

    const customerId = customer.id;

    if (input.contacts.length > 0) {
      const { error: contactsError } = await ctx.supabase
        .from("customer_contacts")
        .insert(
          input.contacts.map((c) => ({
            customer_id: customerId,
            full_name: c.full_name,
            title: emptyToNull(c.title),
            phone: c.phone,
            email: emptyToNull(c.email),
            is_primary: c.is_primary,
            notes: emptyToNull(c.notes),
            created_by: ctx.user.id,
          })),
        );

      if (contactsError) {
        await ctx.supabase.from("customers").delete().eq("id", customerId);
        throw new Error(contactsError.message);
      }
    }

    const { error: respError } = await ctx.supabase
      .from("customer_responsible_users")
      .insert(
        input.responsible_user_ids.map((userId) => ({
          customer_id: customerId,
          user_id: userId,
          is_primary: userId === input.responsible_user_ids[0],
          assigned_by: ctx.user.id,
        })),
      );

    if (respError) {
      await ctx.supabase
        .from("customer_contacts")
        .delete()
        .eq("customer_id", customerId);
      await ctx.supabase.from("customers").delete().eq("id", customerId);
      throw new Error(respError.message);
    }

    revalidatePath("/customers");

    return { success: true, data: { customerId } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

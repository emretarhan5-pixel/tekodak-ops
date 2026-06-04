"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import type { ActionResult } from "@/lib/api/customers/types";
import type { TablesUpdate } from "@/lib/supabase/types";
import {
  updateCustomerSchema,
  type UpdateCustomerInput,
} from "@/schemas/customer";

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

export async function updateCustomer(
  rawInput: UpdateCustomerInput,
): Promise<ActionResult<{ customerId: string }>> {
  try {
    const input = updateCustomerSchema.parse(rawInput);
    const ctx = await getCustomerApiContext();
    assertCanEdit(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("customers")
      .select("id, branch_id, tax_number")
      .eq("id", input.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!existing) {
      throw new CustomerApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, existing.branch_id);

    const branchId = input.branch_id ?? existing.branch_id;
    assertCanAccessBranch(ctx, branchId);

    if (ctx.branchScope && input.branch_id && input.branch_id !== existing.branch_id) {
      return {
        success: false,
        error: "Şube değiştirme yetkiniz yok",
      };
    }

    if (input.tax_number && input.tax_number !== existing.tax_number) {
      const { data: dup } = await ctx.supabase
        .from("customers")
        .select("id")
        .eq("tax_number", input.tax_number)
        .is("deleted_at", null)
        .neq("id", input.id)
        .maybeSingle();

      if (dup) {
        return {
          success: false,
          error: "Bu vergi numarası ile kayıtlı bir müşteri zaten var",
        };
      }
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

    const patch: TablesUpdate<"customers"> = {
      updated_by: ctx.user.id,
    };

    if (input.name !== undefined) patch.name = input.name;
    if (input.tax_office !== undefined) patch.tax_office = emptyToNull(input.tax_office);
    if (input.tax_number !== undefined) patch.tax_number = input.tax_number;
    if (input.customer_type !== undefined) patch.customer_type = input.customer_type;
    if (input.sector !== undefined) patch.sector = emptyToNull(input.sector);
    if (input.main_phone !== undefined) patch.main_phone = input.main_phone;
    if (input.email !== undefined) patch.email = emptyToNull(input.email);
    if (input.website !== undefined) patch.website = emptyToNull(input.website);
    if (input.city !== undefined) patch.city = input.city;
    if (input.district !== undefined) patch.district = emptyToNull(input.district);
    if (input.full_address !== undefined) {
      patch.full_address = emptyToNull(input.full_address);
    }
    if (input.notes !== undefined) patch.notes = emptyToNull(input.notes);
    if (input.branch_id !== undefined) patch.branch_id = input.branch_id;

    const { error: updateError } = await ctx.supabase
      .from("customers")
      .update(patch)
      .eq("id", input.id);

    if (updateError) {
      if (updateError.code === "23505") {
        return {
          success: false,
          error: "Bu vergi numarası ile kayıtlı bir müşteri zaten var",
        };
      }
      throw new Error(updateError.message);
    }

    if (input.contacts) {
      await ctx.supabase
        .from("customer_contacts")
        .delete()
        .eq("customer_id", input.id);

      if (input.contacts.length > 0) {
        const { error: contactsError } = await ctx.supabase
          .from("customer_contacts")
          .insert(
            input.contacts.map((c) => ({
              customer_id: input.id,
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
          throw new Error(contactsError.message);
        }
      }
    }

    if (input.responsible_user_ids) {
      await ctx.supabase
        .from("customer_responsible_users")
        .delete()
        .eq("customer_id", input.id);

      const { error: respError } = await ctx.supabase
        .from("customer_responsible_users")
        .insert(
          input.responsible_user_ids.map((userId, index) => ({
            customer_id: input.id,
            user_id: userId,
            is_primary: index === 0,
            assigned_by: ctx.user.id,
          })),
        );

      if (respError) {
        throw new Error(respError.message);
      }
    }

    revalidatePath("/customers");
    revalidatePath(`/customers/${input.id}`);
    revalidatePath(`/customers/${input.id}/edit`);

    return { success: true, data: { customerId: input.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

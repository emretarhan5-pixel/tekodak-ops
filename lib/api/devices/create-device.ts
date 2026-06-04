"use server";

import { addYears } from "date-fns";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessCustomerBranch,
  assertCanEdit,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import type { ActionResult } from "@/lib/api/devices/types";
import type { TablesInsert } from "@/lib/supabase/types";
import { createDeviceSchema, type CreateDeviceInput } from "@/schemas/device";

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

export async function createDevice(
  rawInput: CreateDeviceInput,
): Promise<ActionResult<{ deviceId: string }>> {
  try {
    const input = createDeviceSchema.parse(rawInput);
    const ctx = await getDeviceApiContext();
    assertCanEdit(ctx);

    const { data: customer, error: custError } = await ctx.supabase
      .from("customers")
      .select("id, branch_id")
      .eq("id", input.customer_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (custError) {
      throw new Error(custError.message);
    }

    if (!customer) {
      return { success: false, error: "Müşteri bulunamadı" };
    }

    assertCanAccessCustomerBranch(ctx, customer.branch_id);

    const { data: model, error: modelError } = await ctx.supabase
      .from("device_models")
      .select("id, brand_id")
      .eq("id", input.model_id)
      .maybeSingle();

    if (modelError) {
      throw new Error(modelError.message);
    }

    if (!model) {
      return { success: false, error: "Model bulunamadı" };
    }

    if (model.brand_id !== input.brand_id) {
      return { success: false, error: "Seçilen model bu markaya ait değil" };
    }

    const { data: brand, error: brandError } = await ctx.supabase
      .from("brands")
      .select("id, default_warranty_years")
      .eq("id", input.brand_id)
      .maybeSingle();

    if (brandError) {
      throw new Error(brandError.message);
    }

    if (!brand) {
      return { success: false, error: "Marka bulunamadı" };
    }

    const { data: dup } = await ctx.supabase
      .from("devices")
      .select("id")
      .eq("serial_number", input.serial_number)
      .is("deleted_at", null)
      .maybeSingle();

    if (dup) {
      return {
        success: false,
        error: "Bu seri numarası ile kayıtlı bir cihaz zaten var",
      };
    }

    let warrantyEnd = input.warranty_end_date;
    if (
      !warrantyEnd &&
      input.installation_date &&
      brand.default_warranty_years != null &&
      brand.default_warranty_years > 0
    ) {
      const inst = new Date(input.installation_date);
      if (!Number.isNaN(inst.getTime())) {
        warrantyEnd = addYears(
          inst,
          brand.default_warranty_years,
        )
          .toISOString()
          .slice(0, 10);
      }
    }

    const row: TablesInsert<"devices"> = {
      serial_number: input.serial_number,
      brand_id: input.brand_id,
      model_id: input.model_id,
      customer_id: input.customer_id,
      branch_id: customer.branch_id,
      manufacturing_year: input.manufacturing_year ?? null,
      warranty_start_date: input.installation_date,
      warranty_end_date: warrantyEnd,
      location_address: emptyToNull(input.location_address),
      status: input.status,
      notes: emptyToNull(input.notes),
      created_by: ctx.user.id,
      updated_by: ctx.user.id,
    };

    const { data: device, error: insertError } = await ctx.supabase
      .from("devices")
      .insert(row)
      .select("id")
      .single();

    if (insertError || !device) {
      if (insertError?.code === "23505") {
        return {
          success: false,
          error: "Bu seri numarası ile kayıtlı bir cihaz zaten var",
        };
      }
      throw new Error(insertError?.message ?? "Cihaz oluşturulamadı");
    }

    revalidatePath("/devices");
    revalidatePath(`/devices/${device.id}`);
    revalidatePath(`/customers/${input.customer_id}`);

    return { success: true, data: { deviceId: device.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

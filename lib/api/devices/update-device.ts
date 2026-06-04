"use server";

import { revalidatePath } from "next/cache";
import { addYears } from "date-fns";

import {
  assertCanAccessCustomerBranch,
  assertCanEdit,
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import type { ActionResult } from "@/lib/api/devices/types";
import type { TablesUpdate } from "@/lib/supabase/types";
import { updateDeviceSchema, type UpdateDeviceInput } from "@/schemas/device";

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

export async function updateDevice(
  rawInput: UpdateDeviceInput,
): Promise<ActionResult<{ deviceId: string }>> {
  try {
    const input = updateDeviceSchema.parse(rawInput);
    const ctx = await getDeviceApiContext();
    assertCanEdit(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("devices")
      .select(
        `
        id,
        customer_id,
        serial_number,
        brand_id,
        model_id,
        warranty_start_date,
        warranty_end_date,
        customers!devices_customer_id_fkey!inner ( branch_id )
      `,
      )
      .eq("id", input.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!existing) {
      throw new DeviceApiError("Cihaz bulunamadı", "NOT_FOUND");
    }

    const row = existing as unknown as {
      id: string;
      customer_id: string;
      serial_number: string;
      brand_id: string;
      model_id: string;
      warranty_start_date: string | null;
      warranty_end_date: string | null;
      customers: { branch_id: string };
    };

    assertCanAccessCustomerBranch(ctx, row.customers.branch_id);

    const targetCustomerId = input.customer_id ?? row.customer_id;

    const { data: targetCustomer, error: tcErr } = await ctx.supabase
      .from("customers")
      .select("id, branch_id")
      .eq("id", targetCustomerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (tcErr) {
      throw new Error(tcErr.message);
    }

    if (!targetCustomer) {
      return { success: false, error: "Müşteri bulunamadı" };
    }

    assertCanAccessCustomerBranch(ctx, targetCustomer.branch_id);

    if (ctx.branchScope && targetCustomer.branch_id !== row.customers.branch_id) {
      return {
        success: false,
        error: "Cihazı başka şubedeki müşteriye taşıma yetkiniz yok",
      };
    }

    const nextBrandId = input.brand_id ?? row.brand_id;
    const nextModelId = input.model_id ?? row.model_id;

    const { data: model, error: modelError } = await ctx.supabase
      .from("device_models")
      .select("id, brand_id")
      .eq("id", nextModelId)
      .maybeSingle();

    if (modelError) {
      throw new Error(modelError.message);
    }

    if (!model) {
      return { success: false, error: "Model bulunamadı" };
    }

    if (model.brand_id !== nextBrandId) {
      return { success: false, error: "Seçilen model bu markaya ait değil" };
    }

    const nextSerial = input.serial_number ?? row.serial_number;
    if (nextSerial !== row.serial_number) {
      const { data: dup } = await ctx.supabase
        .from("devices")
        .select("id")
        .eq("serial_number", nextSerial)
        .is("deleted_at", null)
        .neq("id", input.id)
        .maybeSingle();

      if (dup) {
        return {
          success: false,
          error: "Bu seri numarası ile kayıtlı bir cihaz zaten var",
        };
      }
    }

    const patch: TablesUpdate<"devices"> = {
      updated_by: ctx.user.id,
    };

    if (input.serial_number !== undefined) {
      patch.serial_number = input.serial_number;
    }
    if (input.customer_id !== undefined) {
      patch.customer_id = input.customer_id;
      patch.branch_id = targetCustomer.branch_id;
    }
    if (input.brand_id !== undefined) {
      patch.brand_id = input.brand_id;
    }
    if (input.model_id !== undefined) {
      patch.model_id = input.model_id;
    }
    if (input.manufacturing_year !== undefined) {
      patch.manufacturing_year = input.manufacturing_year;
    }
    if (input.installation_date !== undefined) {
      patch.warranty_start_date = input.installation_date;
    }

    if (input.warranty_end_date !== undefined) {
      patch.warranty_end_date = input.warranty_end_date;
    } else if (
      input.installation_date !== undefined &&
      input.warranty_end_date === undefined
    ) {
      const { data: brand } = await ctx.supabase
        .from("brands")
        .select("default_warranty_years")
        .eq("id", nextBrandId)
        .maybeSingle();

      if (
        brand?.default_warranty_years != null &&
        brand.default_warranty_years > 0 &&
        input.installation_date
      ) {
        const inst = new Date(input.installation_date);
        if (!Number.isNaN(inst.getTime())) {
          patch.warranty_end_date = addYears(inst, brand.default_warranty_years)
            .toISOString()
            .slice(0, 10);
        }
      }
    }

    if (input.location_address !== undefined) {
      patch.location_address = emptyToNull(input.location_address);
    }
    if (input.status !== undefined) {
      patch.status = input.status;
    }
    if (input.notes !== undefined) {
      patch.notes = emptyToNull(input.notes);
    }

    const { error: updateError } = await ctx.supabase
      .from("devices")
      .update(patch)
      .eq("id", input.id);

    if (updateError) {
      if (updateError.code === "23505") {
        return {
          success: false,
          error: "Bu seri numarası ile kayıtlı bir cihaz zaten var",
        };
      }
      throw new Error(updateError.message);
    }

    revalidatePath("/devices");
    revalidatePath(`/devices/${input.id}`);
    revalidatePath(`/devices/${input.id}/edit`);

    return { success: true, data: { deviceId: input.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getContractApiContext,
  toActionError,
} from "@/lib/api/contracts/auth";
import { resolveContractMaintenanceCount } from "@/lib/api/contracts/resolve-maintenance-count";
import type { ActionResult } from "@/lib/api/contracts/types";
import { createContractSchema, type CreateContractInput } from "@/schemas/contract";

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

async function validateDevices(
  ctx: Awaited<ReturnType<typeof getContractApiContext>>,
  customerId: string,
  branchId: string,
  deviceIds: string[],
): Promise<string | null> {
  if (deviceIds.length === 0) {
    return null;
  }

  const unique = [...new Set(deviceIds)];

  const { data: devices, error } = await ctx.supabase
    .from("devices")
    .select("id, customer_id")
    .in("id", unique)
    .eq("customer_id", customerId)
    .is("deleted_at", null);

  if (error) {
    throw new Error(error.message);
  }

  if ((devices ?? []).length !== unique.length) {
    return "Seçilen cihazlardan biri bu müşteriye ait değil veya bulunamadı";
  }

  assertCanAccessBranch(ctx, branchId);
  return null;
}

export async function createContract(
  rawInput: CreateContractInput,
): Promise<ActionResult<{ contractId: string; contractNumber: string }>> {
  try {
    const input = createContractSchema.parse(rawInput);
    const ctx = await getContractApiContext();
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

    assertCanAccessBranch(ctx, customer.branch_id);

    const deviceError = await validateDevices(
      ctx,
      input.customer_id,
      customer.branch_id,
      input.device_ids,
    );
    if (deviceError) {
      return { success: false, error: deviceError };
    }

    if (input.renewed_from_id) {
      const { data: prior } = await ctx.supabase
        .from("contracts")
        .select("id, branch_id, customer_id")
        .eq("id", input.renewed_from_id)
        .is("deleted_at", null)
        .maybeSingle();

      if (!prior) {
        return { success: false, error: "Yenilenecek sözleşme bulunamadı" };
      }

      if (prior.customer_id !== input.customer_id) {
        return {
          success: false,
          error: "Yenileme aynı müşteri için olmalıdır",
        };
      }

      assertCanAccessBranch(ctx, prior.branch_id);
    }

    const { data: responsible, error: userError } = await ctx.supabase
      .from("users")
      .select("id, is_active, deleted_at")
      .eq("id", input.responsible_user_id)
      .maybeSingle();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!responsible?.is_active || responsible.deleted_at) {
      return { success: false, error: "Sorumlu kullanıcı bulunamadı" };
    }

    const maintenanceCount = resolveContractMaintenanceCount(input);

    const { data: contract, error: insertError } = await ctx.supabase
      .from("contracts")
      .insert({
        contract_number: "",
        customer_id: input.customer_id,
        branch_id: customer.branch_id,
        contract_type: input.contract_type,
        start_date: input.start_date,
        end_date: input.end_date,
        currency: input.currency,
        agreed_price: input.agreed_price,
        list_price: input.list_price ?? null,
        minimum_price: input.minimum_price ?? null,
        override_reason: emptyToNull(input.override_reason),
        payment_method: input.payment_method,
        annual_maintenance_count: maintenanceCount,
        total_maintenance_count: maintenanceCount,
        sla_response_hours: input.sla_response_hours,
        parts_included: input.parts_included,
        travel_included: input.travel_included,
        working_hours: input.working_hours,
        vat_included: input.vat_included,
        vat_rate: input.vat_rate,
        status: input.status,
        responsible_user_id: input.responsible_user_id,
        renewed_from_id: input.renewed_from_id ?? null,
        special_terms: emptyToNull(input.special_terms),
        notes: emptyToNull(input.notes),
        created_by: ctx.user.id,
        updated_by: ctx.user.id,
      })
      .select("id, contract_number")
      .single();

    if (insertError || !contract) {
      throw new Error(insertError?.message ?? "Sözleşme oluşturulamadı");
    }

    const contractId = contract.id;

    if (input.device_ids.length > 0) {
      const uniqueDeviceIds = [...new Set(input.device_ids)];
      const { error: linkError } = await ctx.supabase
        .from("contract_devices")
        .insert(
          uniqueDeviceIds.map((deviceId) => ({
            contract_id: contractId,
            device_id: deviceId,
            added_by: ctx.user.id,
          })),
        );

      if (linkError) {
        await ctx.supabase.from("contracts").delete().eq("id", contractId);
        throw new Error(linkError.message);
      }
    }

    revalidatePath("/contracts");
    revalidatePath(`/contracts/${contractId}`);
    revalidatePath(`/customers/${input.customer_id}`);

    for (const deviceId of input.device_ids) {
      revalidatePath(`/devices/${deviceId}`);
    }

    return {
      success: true,
      data: {
        contractId,
        contractNumber: contract.contract_number,
      },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

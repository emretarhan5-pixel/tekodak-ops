"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  ContractApiError,
  getContractApiContext,
  toActionError,
} from "@/lib/api/contracts/auth";
import type { ActionResult } from "@/lib/api/contracts/types";
import {
  contractEditFormSchema,
  type ContractEditFormValues,
} from "@/schemas/contract";

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

const TERMINAL_STATUSES = ["renewed", "expired", "cancelled"] as const;

async function syncContractDevices(
  ctx: Awaited<ReturnType<typeof getContractApiContext>>,
  contractId: string,
  deviceIds: string[],
): Promise<void> {
  const unique = [...new Set(deviceIds)];

  const { data: existing, error: loadError } = await ctx.supabase
    .from("contract_devices")
    .select("id, device_id, removed_at")
    .eq("contract_id", contractId);

  if (loadError) {
    throw new Error(loadError.message);
  }

  const activeByDevice = new Map<string, string>();
  for (const row of existing ?? []) {
    if (!row.removed_at) {
      activeByDevice.set(row.device_id, row.id);
    }
  }

  const allByDevice = new Map<string, { id: string; removed_at: string | null }>();
  for (const row of existing ?? []) {
    allByDevice.set(row.device_id, { id: row.id, removed_at: row.removed_at });
  }

  const toReactivate: string[] = [];
  const toInsert: string[] = [];

  for (const deviceId of unique) {
    if (activeByDevice.has(deviceId)) {
      continue;
    }
    const prior = allByDevice.get(deviceId);
    if (prior?.removed_at) {
      toReactivate.push(prior.id);
    } else {
      toInsert.push(deviceId);
    }
  }

  const toRemove = [...activeByDevice.entries()]
    .filter(([deviceId]) => !unique.includes(deviceId))
    .map(([, linkId]) => linkId);

  if (toReactivate.length > 0) {
    const { error: reactError } = await ctx.supabase
      .from("contract_devices")
      .update({
        removed_at: null,
        removed_by: null,
        added_at: new Date().toISOString(),
        added_by: ctx.user.id,
      })
      .in("id", toReactivate);

    if (reactError) {
      throw new Error(reactError.message);
    }
  }

  if (toInsert.length > 0) {
    const { error: insertError } = await ctx.supabase
      .from("contract_devices")
      .insert(
        toInsert.map((deviceId) => ({
          contract_id: contractId,
          device_id: deviceId,
          added_by: ctx.user.id,
        })),
      );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  if (toRemove.length > 0) {
    const now = new Date().toISOString();
    const { error: removeError } = await ctx.supabase
      .from("contract_devices")
      .update({
        removed_at: now,
        removed_by: ctx.user.id,
      })
      .in("id", toRemove);

    if (removeError) {
      throw new Error(removeError.message);
    }
  }
}

export async function updateContract(
  rawInput: ContractEditFormValues,
): Promise<ActionResult<{ contractId: string }>> {
  try {
    const input = contractEditFormSchema.parse(rawInput);
    const ctx = await getContractApiContext();
    assertCanEdit(ctx);

    const { data: existing, error: loadError } = await ctx.supabase
      .from("contracts")
      .select("id, customer_id, branch_id, status")
      .eq("id", input.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (loadError) {
      throw new Error(loadError.message);
    }

    if (!existing) {
      throw new ContractApiError("Sözleşme bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, existing.branch_id);

    if (
      TERMINAL_STATUSES.includes(
        existing.status as (typeof TERMINAL_STATUSES)[number],
      )
    ) {
      return {
        success: false,
        error: "Yenilenmiş veya sonlandırılmış sözleşme düzenlenemez",
      };
    }

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

    if (input.device_ids.length > 0) {
      const unique = [...new Set(input.device_ids)];
      const { data: devices, error: devErr } = await ctx.supabase
        .from("devices")
        .select("id")
        .in("id", unique)
        .eq("customer_id", input.customer_id)
        .is("deleted_at", null);

      if (devErr) {
        throw new Error(devErr.message);
      }

      if ((devices ?? []).length !== unique.length) {
        return {
          success: false,
          error: "Seçilen cihazlardan biri bu müşteriye ait değil",
        };
      }
    }

    const { error: updateError } = await ctx.supabase
      .from("contracts")
      .update({
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
        annual_maintenance_count: input.annual_maintenance_count,
        sla_response_hours: input.sla_response_hours,
        parts_included: input.parts_included,
        travel_included: input.travel_included,
        working_hours: input.working_hours,
        vat_included: input.vat_included,
        vat_rate: input.vat_rate,
        status: input.status,
        responsible_user_id: input.responsible_user_id,
        special_terms: emptyToNull(input.special_terms),
        notes: emptyToNull(input.notes),
        updated_by: ctx.user.id,
      })
      .eq("id", input.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await syncContractDevices(ctx, input.id, input.device_ids);

    revalidatePath("/contracts");
    revalidatePath(`/contracts/${input.id}`);
    revalidatePath(`/customers/${input.customer_id}`);

    for (const deviceId of input.device_ids) {
      revalidatePath(`/devices/${deviceId}`);
    }

    return { success: true, data: { contractId: input.id } };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

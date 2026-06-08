"use server";

import { revalidatePath } from "next/cache";

import {
  assertCanAccessBranch,
  assertCanEdit,
  getContractApiContext,
  toActionError,
} from "@/lib/api/contracts/auth";
import { getContractById } from "@/lib/api/contracts/get-contract-by-id";
import {
  isRenewableStatus,
  renewContractSchema,
  type RenewContractInput,
} from "@/lib/api/contracts/renewal-helpers";
import type { ActionResult } from "@/lib/api/contracts/types";
import { createContract } from "@/lib/api/contracts/create-contract";
import type { CreateContractInput } from "@/schemas/contract";

export async function renewContract(
  rawInput: RenewContractInput,
): Promise<
  ActionResult<{ contractId: string; contractNumber: string; priorContractId: string }>
> {
  try {
    const input = renewContractSchema.parse(rawInput);
    const ctx = await getContractApiContext();
    assertCanEdit(ctx);

    const prior = await getContractById(input.contractId);

    if (!isRenewableStatus(prior.status)) {
      return {
        success: false,
        error:
          "Yalnızca aktif veya yenileme dönemindeki sözleşmeler yenilenebilir",
      };
    }

    if (input.end_date < input.start_date) {
      return {
        success: false,
        error: "Bitiş tarihi başlangıçtan önce olamaz",
      };
    }

    assertCanAccessBranch(ctx, prior.branch_id);

    const payload: CreateContractInput = {
      customer_id: prior.customer_id,
      contract_type: prior.contract_type,
      start_date: input.start_date,
      end_date: input.end_date,
      currency: prior.currency,
      agreed_price: prior.agreed_price,
      list_price: prior.list_price,
      minimum_price: prior.minimum_price,
      override_reason: prior.override_reason,
      payment_method: prior.payment_method,
      annual_maintenance_count: prior.total_maintenance_count,
      total_maintenance_count: prior.total_maintenance_count,
      sla_response_hours: prior.sla_response_hours,
      parts_included: prior.parts_included,
      travel_included: prior.travel_included,
      working_hours: prior.working_hours,
      vat_included: prior.vat_included,
      vat_rate: prior.vat_rate,
      responsible_user_id: prior.responsible_user_id,
      special_terms: prior.special_terms,
      notes: prior.notes,
      device_ids: prior.devices.map((d) => d.device_id),
      status: "active",
      renewed_from_id: prior.id,
    };

    const result = await createContract(payload);

    if (!result.success) {
      return result;
    }

    revalidatePath("/contracts");
    revalidatePath(`/contracts/${prior.id}`);
    revalidatePath(`/contracts/${result.data.contractId}`);
    revalidatePath(`/customers/${prior.customer_id}`);

    return {
      success: true,
      data: {
        contractId: result.data.contractId,
        contractNumber: result.data.contractNumber,
        priorContractId: prior.id,
      },
    };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

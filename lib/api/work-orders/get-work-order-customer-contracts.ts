"use server";

import {
  assertCanAccessBranch,
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";
import type { ContractType } from "@/lib/constants/contract";
import { CONTRACT_TYPE_LABELS } from "@/lib/constants/contract";

export type WorkOrderFormContractOption = {
  id: string;
  contract_number: string;
  label: string;
};

export async function getWorkOrderCustomerContracts(
  customerId: string,
): Promise<WorkOrderFormContractOption[]> {
  try {
    const ctx = await getWorkOrderApiContext();

    const { data: customer, error: customerError } = await ctx.supabase
      .from("customers")
      .select("id, branch_id")
      .eq("id", customerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (customerError) {
      throw new Error(customerError.message);
    }

    if (!customer) {
      throw new WorkOrderApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, customer.branch_id);

    const { data, error } = await ctx.supabase
      .from("contracts")
      .select("id, contract_number, contract_type, status")
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("end_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => {
      const typed = row as {
        id: string;
        contract_number: string;
        contract_type: ContractType;
        status: string;
      };
      const typeLabel =
        CONTRACT_TYPE_LABELS[typed.contract_type] ?? typed.contract_type;
      return {
        id: typed.id,
        contract_number: typed.contract_number,
        label: `${typed.contract_number} · ${typeLabel} (${typed.status})`,
      };
    });
  } catch (error) {
    if (error instanceof WorkOrderApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

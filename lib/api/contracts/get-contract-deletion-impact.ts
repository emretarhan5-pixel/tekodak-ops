"use server";

import {
  assertCanAccessBranch,
  assertCanDelete,
  getContractApiContext,
} from "@/lib/api/contracts/auth";
import type { ContractDeletionImpact } from "@/lib/api/contracts/types";

export async function getContractDeletionImpact(
  contractId: string,
): Promise<ContractDeletionImpact> {
  const ctx = await getContractApiContext();
  assertCanDelete(ctx);

  const { data: contract } = await ctx.supabase
    .from("contracts")
    .select("id, branch_id")
    .eq("id", contractId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!contract) {
    return { openWorkOrders: 0 };
  }

  assertCanAccessBranch(ctx, contract.branch_id);

  const { count } = await ctx.supabase
    .from("work_orders")
    .select("id", { count: "exact", head: true })
    .eq("contract_id", contractId)
    .in("status", ["new", "assigned", "in_progress", "on_hold"])
    .is("deleted_at", null);

  return { openWorkOrders: count ?? 0 };
}

"use server";

import {
  assertCanEdit,
  getServiceRequestApiContext,
  resolveBranchFilter,
  toActionError,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";
import type { CheckTaxNumberResult } from "@/lib/api/service-requests/types";
import { normalizeTaxNumber } from "@/lib/utils/tax-number";

export async function checkTaxNumber(
  rawTaxNumber: string,
  requestedBranchId?: string,
): Promise<CheckTaxNumberResult> {
  try {
    const normalized = normalizeTaxNumber(rawTaxNumber);
    if (!normalized) {
      return { found: false };
    }

    const ctx = await getServiceRequestApiContext();
    assertCanEdit(ctx);

    let query = ctx.supabase
      .from("customers")
      .select("id, name, main_phone, city, branch_id")
      .eq("tax_number", normalized)
      .is("deleted_at", null);

    const branchFilter = resolveBranchFilter(ctx, requestedBranchId);
    if (branchFilter) {
      query = query.eq("branch_id", branchFilter);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error("[checkTaxNumber] Supabase sorgu hatası:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        taxNumber: normalized,
        branchFilter: branchFilter ?? null,
      });
      return { found: false, error: error.message };
    }

    const row = data?.[0];
    if (!row) {
      return { found: false };
    }

    return {
      found: true,
      customer: {
        id: row.id,
        name: row.name,
        phone: row.main_phone ?? "",
        city: row.city ?? "",
      },
    };
  } catch (error) {
    console.error("[checkTaxNumber] Beklenmeyen hata:", error);
    if (error instanceof ServiceRequestApiError) {
      return { found: false, error: error.message };
    }
    return { found: false, error: toActionError(error) };
  }
}

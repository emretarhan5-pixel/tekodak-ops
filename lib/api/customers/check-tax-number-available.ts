"use server";

import {
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import { isValidTaxNumber, normalizeTaxNumber } from "@/lib/utils/tax-number";

export async function checkTaxNumberAvailable(
  rawTaxNumber: string,
  excludeCustomerId?: string,
): Promise<{ available: boolean; message?: string }> {
  try {
    const normalized = normalizeTaxNumber(rawTaxNumber);

    if (!normalized) {
      return { available: true };
    }

    if (!isValidTaxNumber(normalized)) {
      return {
        available: false,
        message: "Vergi numarası 10 veya 11 haneli olmalıdır",
      };
    }

    const ctx = await getCustomerApiContext();

    let query = ctx.supabase
      .from("customers")
      .select("id")
      .eq("tax_number", normalized)
      .is("deleted_at", null);

    if (excludeCustomerId) {
      query = query.neq("id", excludeCustomerId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (data) {
      return {
        available: false,
        message: "Bu vergi numarası ile kayıtlı bir müşteri zaten var",
      };
    }

    return { available: true };
  } catch (error) {
    if (error instanceof CustomerApiError) {
      return { available: false, message: error.message };
    }
    return { available: false, message: toActionError(error) };
  }
}

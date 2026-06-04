"use server";

import {
  assertCanAccessBranch,
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import {
  computeWarrantyBadge,
} from "@/lib/api/devices/device-warranty";
import type { CustomerDeviceItem } from "@/lib/api/devices/types";
import type { DeviceStatus } from "@/lib/constants/device";

export async function getCustomerDevices(
  customerId: string,
): Promise<CustomerDeviceItem[]> {
  try {
    const ctx = await getCustomerApiContext();

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
      throw new CustomerApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, customer.branch_id);

    const { data, error } = await ctx.supabase
      .from("devices")
      .select(
        `
        id,
        serial_number,
        status,
        warranty_end_date,
        brands!devices_brand_id_fkey!inner ( name ),
        device_models!devices_model_id_fkey!inner ( model_name )
      `,
      )
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("serial_number", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => {
      const typed = row as typeof row & {
        brands: { name: string };
        device_models: { model_name: string };
      };
      return {
        id: typed.id,
        serial_number: typed.serial_number,
        brand_name: typed.brands.name,
        model_name: typed.device_models.model_name,
        status: typed.status as DeviceStatus,
        warranty_badge: computeWarrantyBadge(typed.warranty_end_date),
      };
    });
  } catch (error) {
    if (error instanceof CustomerApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

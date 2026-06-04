"use server";

import {
  assertCanAccessBranch,
  getWorkOrderApiContext,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";

export type WorkOrderFormDeviceOption = {
  id: string;
  serial_number: string;
  brand_name: string;
  model_name: string;
};

/**
 * Müşteriye ait silinmemiş cihazlar — sözleşme formundaki getContractCustomerDevices
 * ile aynı devices.customer_id filtresi.
 */
export async function getWorkOrderCustomerDevices(
  customerId: string,
): Promise<WorkOrderFormDeviceOption[]> {
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
      .from("devices")
      .select(
        `
        id,
        serial_number,
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
      };
    });
  } catch (error) {
    if (error instanceof WorkOrderApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

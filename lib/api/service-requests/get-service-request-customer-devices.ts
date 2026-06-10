"use server";

import {
  assertCanAccessBranch,
  getServiceRequestApiContext,
  toActionError,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";

export type ServiceRequestCustomerDeviceOption = {
  id: string;
  serial_number: string;
  model_id: string;
  brand_name: string;
  model_name: string;
  label: string;
};

export async function getServiceRequestCustomerDevices(
  customerId: string,
): Promise<ServiceRequestCustomerDeviceOption[]> {
  try {
    const ctx = await getServiceRequestApiContext();

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
      throw new ServiceRequestApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, customer.branch_id);

    const { data, error } = await ctx.supabase
      .from("devices")
      .select(
        `
        id,
        serial_number,
        model_id,
        brands!devices_brand_id_fkey!inner ( name ),
        device_models!devices_model_id_fkey!inner ( model_name )
      `,
      )
      .eq("customer_id", customerId)
      .eq("status", "active")
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
      const brandName = typed.brands.name;
      const modelName = typed.device_models.model_name;
      return {
        id: typed.id,
        serial_number: typed.serial_number,
        model_id: typed.model_id,
        brand_name: brandName,
        model_name: modelName,
        label: [brandName, modelName].filter(Boolean).join(" · "),
      };
    });
  } catch (error) {
    if (error instanceof ServiceRequestApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

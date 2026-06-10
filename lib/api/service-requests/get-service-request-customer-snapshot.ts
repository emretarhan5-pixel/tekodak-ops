"use server";

import {
  assertCanAccessBranch,
  getServiceRequestApiContext,
  toActionError,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";

export type ServiceRequestCustomerSnapshot = {
  customer_id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  address: string;
};

function formatCustomerAddress(row: {
  full_address: string | null;
  district: string | null;
  city: string | null;
}): string {
  if (row.full_address?.trim()) {
    return row.full_address.trim();
  }

  return [row.district, row.city].filter(Boolean).join(", ");
}

export async function getServiceRequestCustomerSnapshot(
  customerId: string,
): Promise<ServiceRequestCustomerSnapshot> {
  try {
    const ctx = await getServiceRequestApiContext();

    const { data, error } = await ctx.supabase
      .from("customers")
      .select(
        `
        id,
        name,
        main_phone,
        city,
        district,
        full_address,
        branch_id,
        customer_contacts (
          full_name,
          is_primary
        )
      `,
      )
      .eq("id", customerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new ServiceRequestApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessBranch(ctx, data.branch_id);

    const contacts = (data.customer_contacts ?? []) as Array<{
      full_name: string;
      is_primary: boolean;
    }>;

    const primaryContact =
      contacts.find((contact) => contact.is_primary) ?? contacts[0] ?? null;

    return {
      customer_id: data.id,
      company_name: data.name,
      contact_name: primaryContact?.full_name ?? "",
      phone: data.main_phone ?? "",
      address: formatCustomerAddress(data),
    };
  } catch (error) {
    if (error instanceof ServiceRequestApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

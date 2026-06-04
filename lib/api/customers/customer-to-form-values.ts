import type { CustomerDetail } from "@/lib/api/customers/types";
import type { CustomerType } from "@/lib/constants/customer";
import { formatTurkishPhoneDisplay } from "@/lib/utils/phone";
import type { CustomerFormValues } from "@/schemas/customer";

export function customerDetailToFormValues(
  customer: CustomerDetail,
): CustomerFormValues {
  const responsibleOrdered = [
    ...customer.responsible_users.filter((r) => r.is_primary),
    ...customer.responsible_users.filter((r) => !r.is_primary),
  ];
  const responsibleIds = responsibleOrdered.map((r) => r.user_id);
  const primaryId =
    customer.responsible_users.find((r) => r.is_primary)?.user_id ??
    responsibleIds[0] ??
    "";

  return {
    name: customer.name,
    tax_office: customer.tax_office ?? "",
    tax_number: customer.tax_number,
    customer_type: customer.customer_type as CustomerType,
    sector: customer.sector ?? "",
    main_phone: formatTurkishPhoneDisplay(customer.main_phone),
    email: customer.email ?? "",
    website: customer.website ?? "",
    city: customer.city,
    district: customer.district ?? "",
    full_address: customer.full_address ?? "",
    notes: customer.notes ?? "",
    branch_id: customer.branch_id,
    contacts: customer.contacts.map((contact) => ({
      full_name: contact.full_name,
      title: contact.title ?? "",
      phone: contact.phone ? formatTurkishPhoneDisplay(contact.phone) : "",
      email: contact.email ?? "",
      is_primary: contact.is_primary,
      notes: contact.notes ?? "",
    })),
    responsible_user_ids: responsibleIds,
    primary_responsible_user_id: primaryId,
  };
}

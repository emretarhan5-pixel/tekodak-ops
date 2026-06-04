import type { ContractDetail } from "@/lib/api/contracts/types";
import type { ContractEditFormValues } from "@/schemas/contract";

export function contractDetailToFormValues(
  contract: ContractDetail,
): ContractEditFormValues {
  return {
    id: contract.id,
    customer_id: contract.customer_id,
    contract_type: contract.contract_type,
    start_date: contract.start_date,
    end_date: contract.end_date,
    currency: contract.currency,
    agreed_price: contract.agreed_price,
    list_price: contract.list_price,
    minimum_price: contract.minimum_price,
    override_reason: contract.override_reason,
    payment_method: contract.payment_method,
    annual_maintenance_count: contract.annual_maintenance_count,
    sla_response_hours: contract.sla_response_hours,
    parts_included: contract.parts_included,
    travel_included: contract.travel_included,
    working_hours: contract.working_hours,
    vat_included: contract.vat_included,
    vat_rate: contract.vat_rate,
    responsible_user_id: contract.responsible_user_id,
    special_terms: contract.special_terms ?? "",
    notes: contract.notes ?? "",
    device_ids: contract.devices.map((d) => d.device_id),
    status: contract.status,
    renewed_from_id: null,
  };
}

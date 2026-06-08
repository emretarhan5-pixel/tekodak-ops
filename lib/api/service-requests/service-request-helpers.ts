import type { ServiceRequestApiContext } from "@/lib/api/service-requests/auth";
import {
  ServiceRequestApiError,
  assertCanAccessBranch,
  assertCanEditServiceRequest,
} from "@/lib/api/service-requests/auth";
import type {
  ServiceRequestStatus,
  ServiceRequestVatOption,
} from "@/lib/constants/service-request";
import { isTerminalServiceRequestStatus } from "@/lib/api/service-requests/service-request-status";
import {
  calculateQuoteTotals,
  roundMoney,
} from "@/lib/utils/service-request-quote";
import type { ServiceRequestQuoteLineInput } from "@/schemas/service-request";

export type ServiceRequestRow = {
  id: string;
  request_number: string;
  branch_id: string;
  status: ServiceRequestStatus;
  current_step: number;
  assigned_technician_id: string;
  company_name: string;
  contact_name: string;
  phone: string;
  address: string;
  device_type: string;
  brand_model: string;
  device_model_id: string | null;
  serial_number: string;
  under_warranty: boolean;
  reported_fault: string;
  diagnosed_fault: string | null;
  customer_statement: string | null;
  technical_inspection_result: string | null;
  wrong_usage_detected: boolean;
  labor_cost: number | null;
  shipping_cost: number | null;
  vat_option: ServiceRequestVatOption | null;
  quote_subtotal: number | null;
  quote_total: number | null;
  quote_sent_to_customer: boolean;
  customer_decision: string;
  device_returned: boolean;
  work_description: string | null;
  delivery_method: string | null;
  delivered: boolean;
  invoice_issued: boolean;
  invoice_number: string | null;
  payment_received: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
};

export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

export { calculateQuoteTotals, roundMoney };

export function resolveBranchIdForCreate(
  ctx: ServiceRequestApiContext,
  requestedBranchId?: string,
): string {
  if (ctx.branchScope) {
    return ctx.branchScope;
  }

  if (!requestedBranchId) {
    throw new ServiceRequestApiError(
      "Admin kullanıcılar için şube seçimi zorunludur",
      "FORBIDDEN",
    );
  }

  return requestedBranchId;
}

export async function validateDeviceModelId(
  ctx: ServiceRequestApiContext,
  deviceModelId: string | null,
): Promise<void> {
  if (!deviceModelId) return;

  const { data, error } = await ctx.supabase
    .from("device_models")
    .select("id")
    .eq("id", deviceModelId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new ServiceRequestApiError("Seçilen model bulunamadı", "NOT_FOUND");
  }
}

export async function loadServiceRequestOrThrow(
  ctx: ServiceRequestApiContext,
  serviceRequestId: string,
): Promise<ServiceRequestRow> {
  const { data, error } = await ctx.supabase
    .from("service_requests")
    .select("*")
    .eq("id", serviceRequestId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new ServiceRequestApiError("Servis talebi bulunamadı", "NOT_FOUND");
  }

  const row = data as ServiceRequestRow;
  assertCanAccessBranch(ctx, row.branch_id);
  return row;
}

export async function loadServiceRequestForEdit(
  ctx: ServiceRequestApiContext,
  serviceRequestId: string,
): Promise<ServiceRequestRow> {
  const row = await loadServiceRequestOrThrow(ctx, serviceRequestId);
  assertCanEditServiceRequest(ctx, row);

  if (isTerminalServiceRequestStatus(row.status)) {
    throw new ServiceRequestApiError(
      "Tamamlanmış veya reddedilmiş talep düzenlenemez",
      "FORBIDDEN",
    );
  }

  return row;
}

export function assertStatus(
  row: ServiceRequestRow,
  allowed: ServiceRequestStatus[],
): void {
  if (!allowed.includes(row.status)) {
    throw new ServiceRequestApiError(
      "Bu adım için talep durumu uygun değil",
      "FORBIDDEN",
    );
  }
}

export function matchesCreatedDateRange(
  createdAt: string,
  dateFrom?: string,
  dateTo?: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const day = createdAt.slice(0, 10);
  if (dateFrom && day < dateFrom) return false;
  if (dateTo && day > dateTo) return false;
  return true;
}

export async function syncQuoteLines(
  ctx: ServiceRequestApiContext,
  serviceRequestId: string,
  lines: ServiceRequestQuoteLineInput[],
): Promise<void> {
  const { error: deleteError } = await ctx.supabase
    .from("service_request_quote_lines")
    .delete()
    .eq("service_request_id", serviceRequestId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (lines.length === 0) {
    return;
  }

  const rows = lines.map((line, index) => ({
    service_request_id: serviceRequestId,
    description: line.description.trim(),
    unit_price: line.unit_price,
    quantity: line.quantity,
    sort_order: index,
  }));

  const { error: insertError } = await ctx.supabase
    .from("service_request_quote_lines")
    .insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

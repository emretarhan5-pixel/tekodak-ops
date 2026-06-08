"use server";

import {
  assertCanEditServiceRequest,
  getServiceRequestApiContext,
  toActionError,
  ServiceRequestApiError,
} from "@/lib/api/service-requests/auth";
import { loadServiceRequestOrThrow } from "@/lib/api/service-requests/service-request-helpers";
import {
  getActiveEditStep,
  getServiceRequestStatusVariant,
} from "@/lib/api/service-requests/service-request-status";
import type {
  ServiceRequestDetail,
  ServiceRequestPartItem,
  ServiceRequestPhotoItem,
  ServiceRequestQuoteLineItem,
} from "@/lib/api/service-requests/types";
import type {
  ServiceRequestCustomerDecision,
  ServiceRequestDeliveryMethod,
  ServiceRequestStatus,
  ServiceRequestStep,
  ServiceRequestVatOption,
} from "@/lib/constants/service-request";
import type { PartUnit } from "@/lib/constants/stock-item";

const DETAIL_SELECT = `
  id,
  request_number,
  branch_id,
  status,
  current_step,
  company_name,
  contact_name,
  phone,
  address,
  device_type,
  brand_model,
  device_model_id,
  serial_number,
  device_id,
  customer_id,
  under_warranty,
  reported_fault,
  assigned_technician_id,
  diagnosed_fault,
  customer_statement,
  technical_inspection_result,
  wrong_usage_detected,
  labor_cost,
  shipping_cost,
  vat_option,
  quote_subtotal,
  quote_total,
  quote_sent_to_customer,
  customer_decision,
  device_returned,
  work_description,
  delivery_method,
  delivered,
  invoice_issued,
  invoice_number,
  payment_received,
  completed_at,
  created_at,
  updated_at,
  branches!service_requests_branch_id_fkey!inner (
    name,
    code
  ),
  technician:users!service_requests_assigned_technician_id_fkey (
    full_name
  ),
  creator:users!service_requests_created_by_fkey (
    full_name
  )
`;

const QUOTE_LINES_SELECT = `
  id,
  description,
  unit_price,
  quantity,
  line_total,
  sort_order
`;

const PARTS_SELECT = `
  id,
  part_id,
  quantity,
  notes,
  inventory_movement_id,
  created_at,
  parts!service_request_parts_part_id_fkey (
    part_code,
    description,
    unit
  ),
  creator:users!service_request_parts_created_by_fkey (
    full_name
  )
`;

const PHOTOS_SELECT = `
  id,
  step,
  storage_path,
  file_name,
  mime_type,
  file_size_bytes,
  created_at,
  uploaded_by,
  uploader:users!service_request_photos_uploaded_by_fkey (
    full_name
  )
`;

type RawDetailRow = {
  id: string;
  request_number: string;
  branch_id: string;
  status: ServiceRequestStatus;
  current_step: number;
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
  assigned_technician_id: string;
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
  customer_decision: ServiceRequestCustomerDecision;
  device_returned: boolean;
  work_description: string | null;
  delivery_method: ServiceRequestDeliveryMethod | null;
  delivered: boolean;
  invoice_issued: boolean;
  invoice_number: string | null;
  payment_received: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  branches: { name: string; code: string };
  technician: { full_name: string } | null;
  creator: { full_name: string } | null;
};

export async function getServiceRequestById(
  serviceRequestId: string,
): Promise<ServiceRequestDetail> {
  try {
    const ctx = await getServiceRequestApiContext();
    await loadServiceRequestOrThrow(ctx, serviceRequestId);

    const [detailRes, quoteRes, partsRes, photosRes] = await Promise.all([
      ctx.supabase
        .from("service_requests")
        .select(DETAIL_SELECT)
        .eq("id", serviceRequestId)
        .is("deleted_at", null)
        .maybeSingle(),
      ctx.supabase
        .from("service_request_quote_lines")
        .select(QUOTE_LINES_SELECT)
        .eq("service_request_id", serviceRequestId)
        .order("sort_order", { ascending: true }),
      ctx.supabase
        .from("service_request_parts")
        .select(PARTS_SELECT)
        .eq("service_request_id", serviceRequestId)
        .order("created_at", { ascending: true }),
      ctx.supabase
        .from("service_request_photos")
        .select(PHOTOS_SELECT)
        .eq("service_request_id", serviceRequestId)
        .order("created_at", { ascending: true }),
    ]);

    if (detailRes.error) {
      throw new Error(detailRes.error.message);
    }
    if (!detailRes.data) {
      throw new ServiceRequestApiError("Servis talebi bulunamadı", "NOT_FOUND");
    }
    if (quoteRes.error) {
      throw new Error(quoteRes.error.message);
    }
    if (partsRes.error) {
      throw new Error(partsRes.error.message);
    }
    if (photosRes.error) {
      throw new Error(photosRes.error.message);
    }

    const row = detailRes.data as unknown as RawDetailRow;
    const status = row.status;

    let canEdit = false;
    try {
      assertCanEditServiceRequest(ctx, {
        branch_id: row.branch_id,
        assigned_technician_id: row.assigned_technician_id,
        status,
      });
      canEdit = !["tamamlandi", "rejected"].includes(status);
    } catch {
      canEdit = false;
    }

    const quote_lines = ((quoteRes.data ?? []) as unknown as Array<{
      id: string;
      description: string;
      unit_price: number;
      quantity: number;
      line_total: number;
      sort_order: number;
    }>).map(
      (line): ServiceRequestQuoteLineItem => ({
        id: line.id,
        description: line.description,
        unit_price: line.unit_price,
        quantity: line.quantity,
        line_total: line.line_total,
        sort_order: line.sort_order,
      }),
    );

    const parts = ((partsRes.data ?? []) as unknown as Array<{
      id: string;
      part_id: string;
      quantity: number;
      notes: string | null;
      inventory_movement_id: string | null;
      created_at: string;
      parts: {
        part_code: string;
        description: string;
        unit: PartUnit;
      };
      creator: { full_name: string } | null;
    }>).map(
      (part): ServiceRequestPartItem => ({
        id: part.id,
        part_id: part.part_id,
        part_code: part.parts.part_code,
        part_description: part.parts.description,
        part_unit: part.parts.unit,
        quantity: part.quantity,
        notes: part.notes,
        inventory_movement_id: part.inventory_movement_id,
        created_at: part.created_at,
        created_by_name: part.creator?.full_name ?? "—",
      }),
    );

    let resolvedDeviceId = (row as { device_id?: string | null }).device_id ?? null;

    if (!resolvedDeviceId) {
      const { data: matchedDevice } = await ctx.supabase
        .from("devices")
        .select("id")
        .eq("serial_number", row.serial_number)
        .is("deleted_at", null)
        .maybeSingle();

      resolvedDeviceId = matchedDevice?.id ?? null;
    }

    const photos = ((photosRes.data ?? []) as unknown as Array<{
      id: string;
      step: number;
      storage_path: string;
      file_name: string;
      mime_type: string;
      file_size_bytes: number;
      created_at: string;
      uploaded_by: string;
      uploader: { full_name: string } | null;
    }>).map(
      (photo): ServiceRequestPhotoItem => ({
        id: photo.id,
        step: photo.step as ServiceRequestStep,
        storage_path: photo.storage_path,
        file_name: photo.file_name,
        mime_type: photo.mime_type,
        file_size_bytes: photo.file_size_bytes,
        created_at: photo.created_at,
        uploaded_by: photo.uploaded_by,
        uploaded_by_name: photo.uploader?.full_name ?? "—",
      }),
    );

    return {
      id: row.id,
      request_number: row.request_number,
      branch_id: row.branch_id,
      branch_name: row.branches.name,
      branch_code: row.branches.code,
      status,
      status_variant: getServiceRequestStatusVariant(status),
      current_step: row.current_step as ServiceRequestStep,
      active_edit_step: getActiveEditStep(status),
      can_edit: canEdit,
      company_name: row.company_name,
      contact_name: row.contact_name,
      phone: row.phone,
      address: row.address,
      device_type: row.device_type,
      brand_model: row.brand_model,
      device_model_id: row.device_model_id,
      serial_number: row.serial_number,
      device_id: resolvedDeviceId,
      under_warranty: row.under_warranty,
      reported_fault: row.reported_fault,
      assigned_technician_id: row.assigned_technician_id,
      technician_name: row.technician?.full_name ?? "—",
      diagnosed_fault: row.diagnosed_fault,
      customer_statement: row.customer_statement,
      technical_inspection_result: row.technical_inspection_result,
      wrong_usage_detected: row.wrong_usage_detected,
      labor_cost: row.labor_cost,
      shipping_cost: row.shipping_cost,
      vat_option: row.vat_option,
      quote_subtotal: row.quote_subtotal,
      quote_total: row.quote_total,
      quote_sent_to_customer: row.quote_sent_to_customer,
      customer_decision: row.customer_decision,
      device_returned: row.device_returned,
      quote_lines,
      work_description: row.work_description,
      delivery_method: row.delivery_method,
      delivered: row.delivered,
      parts,
      invoice_issued: row.invoice_issued,
      invoice_number: row.invoice_number,
      payment_received: row.payment_received,
      completed_at: row.completed_at,
      photos,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by_name: row.creator?.full_name ?? "—",
    };
  } catch (error) {
    if (error instanceof ServiceRequestApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

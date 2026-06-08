"use server";

import {
  assertCanAccessCustomerBranch,
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import type { DeviceDetail } from "@/lib/api/devices/types";
import type { DeviceStatus } from "@/lib/constants/device";
import type {
  DeviceScrapNextStep,
  DeviceScrapReason,
  DeviceScrapStatus,
} from "@/lib/constants/device-scrap";

const DEVICE_DETAIL_SELECT = `
  id,
  serial_number,
  manufacturing_year,
  warranty_start_date,
  warranty_end_date,
  location_address,
  status,
  notes,
  customer_id,
  brand_id,
  model_id,
  created_at,
  updated_at,
  is_scrapped,
  scrap_status,
  scrap_reason,
  scrap_notes,
  scrap_next_step,
  scrapped_by,
  scrapped_at,
  scrap_approved_by,
  scrap_approved_at,
  scrap_rejection_reason,
  scrapped_user:users!devices_scrapped_by_fkey (
    full_name
  ),
  customers!devices_customer_id_fkey!inner (
    id,
    name,
    branch_id,
    branches!inner (
      name,
      code
    )
  ),
  brands!devices_brand_id_fkey!inner (
    id,
    name,
    default_warranty_years
  ),
  device_models!devices_model_id_fkey!inner (
    id,
    model_name
  ),
  device_pins (
    user_id
  )
`;

export async function getDeviceById(deviceId: string): Promise<DeviceDetail> {
  try {
    const ctx = await getDeviceApiContext();

    const { data, error } = await ctx.supabase
      .from("devices")
      .select(DEVICE_DETAIL_SELECT)
      .eq("id", deviceId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new DeviceApiError("Cihaz bulunamadı", "NOT_FOUND");
    }

    const row = data as unknown as {
      id: string;
      serial_number: string;
      manufacturing_year: number | null;
      warranty_start_date: string | null;
      warranty_end_date: string | null;
      location_address: string | null;
      status: DeviceStatus;
      notes: string | null;
      customer_id: string;
      brand_id: string;
      model_id: string;
      created_at: string;
      updated_at: string;
      is_scrapped: boolean;
      scrap_status: DeviceScrapStatus | null;
      scrap_reason: DeviceScrapReason | null;
      scrap_notes: string | null;
      scrap_next_step: DeviceScrapNextStep | null;
      scrapped_by: string | null;
      scrapped_at: string | null;
      scrap_approved_by: string | null;
      scrap_approved_at: string | null;
      scrap_rejection_reason: string | null;
      scrapped_user: { full_name: string } | null;
      customers: {
        id: string;
        name: string;
        branch_id: string;
        branches: { name: string; code: string };
      };
      brands: {
        id: string;
        name: string;
        default_warranty_years: number | null;
      };
      device_models: { id: string; model_name: string };
      device_pins: Array<{ user_id: string }>;
    };

    assertCanAccessCustomerBranch(ctx, row.customers.branch_id);

    return {
      id: row.id,
      serial_number: row.serial_number,
      manufacturing_year: row.manufacturing_year,
      installation_date: row.warranty_start_date,
      warranty_end_date: row.warranty_end_date,
      location_address: row.location_address,
      status: row.status,
      notes: row.notes,
      customer_id: row.customers.id,
      customer_name: row.customers.name,
      branch_id: row.customers.branch_id,
      branch_name: row.customers.branches.name,
      branch_code: row.customers.branches.code,
      brand_id: row.brands.id,
      brand_name: row.brands.name,
      default_warranty_years: row.brands.default_warranty_years,
      model_id: row.device_models.id,
      model_name: row.device_models.model_name,
      model_code: null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_pinned: (row.device_pins ?? []).some((p) => p.user_id === ctx.user.id),
      is_scrapped: row.is_scrapped,
      scrap_status: row.scrap_status,
      scrap_reason: row.scrap_reason,
      scrap_notes: row.scrap_notes,
      scrap_next_step: row.scrap_next_step,
      scrapped_by: row.scrapped_by,
      scrapped_by_name: row.scrapped_user?.full_name ?? null,
      scrapped_at: row.scrapped_at,
      scrap_approved_by: row.scrap_approved_by,
      scrap_approved_at: row.scrap_approved_at,
      scrap_rejection_reason: row.scrap_rejection_reason,
    };
  } catch (error) {
    if (error instanceof DeviceApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

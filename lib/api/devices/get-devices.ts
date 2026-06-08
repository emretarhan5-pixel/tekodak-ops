"use server";

import {
  DeviceApiError,
  getDeviceApiContext,
  resolveBranchFilter,
  toActionError,
} from "@/lib/api/devices/auth";
import {
  computeWarrantyBadge,
  warrantyBadgeMatchesFilter,
} from "@/lib/api/devices/device-warranty";
import type { DeviceListItem, DeviceListResult } from "@/lib/api/devices/types";
import type { DeviceStatus } from "@/lib/constants/device";
import type { DeviceScrapStatus } from "@/lib/constants/device-scrap";
import { deviceFilterSchema, type DeviceFilterInput } from "@/schemas/device";

const DEVICE_LIST_SELECT = `
  id,
  serial_number,
  status,
  warranty_start_date,
  warranty_end_date,
  customer_id,
  brand_id,
  model_id,
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
    name
  ),
  device_models!devices_model_id_fkey!inner (
    id,
    model_name
  ),
  device_pins (
    user_id
  )
`;

type RawDeviceRow = {
  id: string;
  serial_number: string;
  status: DeviceStatus;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  is_scrapped: boolean;
  scrap_status: DeviceScrapStatus | null;
  customer_id: string;
  brand_id: string;
  model_id: string;
  customers: {
    id: string;
    name: string;
    branch_id: string;
    branches: { name: string; code: string };
  };
  brands: { id: string; name: string };
  device_models: { id: string; model_name: string };
  device_pins: Array<{ user_id: string }>;
};

function mapRow(row: RawDeviceRow, userId: string): DeviceListItem {
  const warranty_badge = computeWarrantyBadge(row.warranty_end_date);

  return {
    id: row.id,
    serial_number: row.serial_number,
    brand_id: row.brand_id,
    brand_name: row.brands.name,
    model_id: row.model_id,
    model_name: row.device_models.model_name,
    customer_id: row.customer_id,
    customer_name: row.customers.name,
    branch_id: row.customers.branch_id,
    branch_name: row.customers.branches.name,
    branch_code: row.customers.branches.code,
    status: row.status,
    warranty_badge,
    warranty_end_date: row.warranty_end_date,
    installation_date: row.warranty_start_date,
    is_pinned: (row.device_pins ?? []).some((p) => p.user_id === userId),
    is_scrapped: row.is_scrapped,
    scrap_status: row.scrap_status,
  };
}

export async function getDevices(
  rawFilters: DeviceFilterInput,
): Promise<DeviceListResult> {
  try {
    const filters = deviceFilterSchema.parse(rawFilters);
    const ctx = await getDeviceApiContext();
    const branchId = resolveBranchFilter(ctx, filters.branchId);

    let query = ctx.supabase
      .from("devices")
      .select(DEVICE_LIST_SELECT)
      .is("deleted_at", null)
      .order("serial_number", { ascending: true });

    if (branchId) {
      const { data: custRows, error: custErr } = await ctx.supabase
        .from("customers")
        .select("id")
        .eq("branch_id", branchId)
        .is("deleted_at", null);

      if (custErr) {
        throw new Error(custErr.message);
      }

      const ids = (custRows ?? []).map((c) => c.id);
      if (ids.length === 0) {
        return {
          data: [],
          total: 0,
          page: filters.page,
          pageSize: filters.pageSize,
        };
      }
      query = query.in("customer_id", ids);
    }

    if (filters.brandId) {
      query = query.eq("brand_id", filters.brandId);
    }

    if (filters.customerId) {
      query = query.eq("customer_id", filters.customerId);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.search?.trim()) {
      const term = filters.search.trim().replace(/%/g, "\\%");
      query = query.or(
        `serial_number.ilike.%${term}%,customers.name.ilike.%${term}%`,
      );
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rawRows = rows as unknown as RawDeviceRow[];

    let mapped = rawRows.map((row) => mapRow(row, ctx.user.id));

    if (filters.warrantyStatus) {
      mapped = mapped.filter((d) =>
        warrantyBadgeMatchesFilter(d.warranty_badge, filters.warrantyStatus!),
      );
    }

    if (filters.showScrapped === false) {
      mapped = mapped.filter(
        (d) => !d.is_scrapped && d.scrap_status !== "pending_approval",
      );
    }

    const total = mapped.length;
    const from = (filters.page - 1) * filters.pageSize;
    const data = mapped.slice(from, from + filters.pageSize);

    return {
      data,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  } catch (error) {
    if (error instanceof DeviceApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

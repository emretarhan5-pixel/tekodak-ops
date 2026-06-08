"use server";

import {
  assertCanAccessBranch,
  ContractApiError,
  getContractApiContext,
  toActionError,
} from "@/lib/api/contracts/auth";
import {
  computeContractRenewalBadge,
  computeDaysRemaining,
} from "@/lib/api/contracts/contract-badge";
import type { ContractDetail } from "@/lib/api/contracts/types";
import type {
  ContractCurrency,
  ContractPaymentMethod,
  ContractStatus,
  ContractType,
  ContractWorkingHours,
} from "@/lib/constants/contract";

const CONTRACT_DETAIL_SELECT = `
  id,
  contract_number,
  customer_id,
  branch_id,
  contract_type,
  start_date,
  end_date,
  status,
  annual_maintenance_count,
  total_maintenance_count,
  completed_maintenance_count,
  sla_response_hours,
  parts_included,
  travel_included,
  working_hours,
  list_price,
  minimum_price,
  agreed_price,
  currency,
  override_reason,
  payment_method,
  vat_included,
  vat_rate,
  responsible_user_id,
  renewed_from_id,
  renewed_to_id,
  special_terms,
  notes,
  created_at,
  updated_at,
  customers!contracts_customer_id_fkey!inner (
    id,
    name
  ),
  branches!contracts_branch_id_fkey!inner (
    name,
    code
  ),
  users!contracts_responsible_user_id_fkey (
    full_name
  )
`;

export async function getContractById(
  contractId: string,
): Promise<ContractDetail> {
  try {
    const ctx = await getContractApiContext();

    const { data, error } = await ctx.supabase
      .from("contracts")
      .select(CONTRACT_DETAIL_SELECT)
      .eq("id", contractId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new ContractApiError("Sözleşme bulunamadı", "NOT_FOUND");
    }

    const row = data as unknown as {
      id: string;
      contract_number: string;
      customer_id: string;
      branch_id: string;
      contract_type: ContractType;
      start_date: string;
      end_date: string;
      status: ContractStatus;
      annual_maintenance_count: number | null;
      total_maintenance_count: number | null;
      completed_maintenance_count: number | null;
      sla_response_hours: number | null;
      parts_included: boolean | null;
      travel_included: boolean | null;
      working_hours: ContractWorkingHours | null;
      list_price: number | null;
      minimum_price: number | null;
      agreed_price: number;
      currency: ContractCurrency | null;
      override_reason: string | null;
      payment_method: ContractPaymentMethod | null;
      vat_included: boolean | null;
      vat_rate: number | null;
      responsible_user_id: string;
      renewed_from_id: string | null;
      renewed_to_id: string | null;
      special_terms: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
      customers: { id: string; name: string };
      branches: { name: string; code: string };
      users: { full_name: string } | null;
    };

    assertCanAccessBranch(ctx, row.branch_id);

    const { data: deviceRows, error: devicesError } = await ctx.supabase
      .from("contract_devices")
      .select(
        `
        id,
        device_id,
        devices!contract_devices_device_id_fkey!inner (
          id,
          serial_number,
          deleted_at,
          brands!devices_brand_id_fkey!inner ( name ),
          device_models!devices_model_id_fkey!inner ( model_name )
        )
      `,
      )
      .eq("contract_id", contractId)
      .is("removed_at", null);

    if (devicesError) {
      throw new Error(devicesError.message);
    }

    const devices = (deviceRows ?? [])
      .map((link) => {
        const typed = link as typeof link & {
          devices: {
            id: string;
            serial_number: string;
            deleted_at: string | null;
            brands: { name: string };
            device_models: { model_name: string };
          };
        };
        if (typed.devices.deleted_at) {
          return null;
        }
        return {
          id: typed.id,
          device_id: typed.devices.id,
          serial_number: typed.devices.serial_number,
          brand_name: typed.devices.brands.name,
          model_name: typed.devices.device_models.model_name,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    const { count: fileCount, error: filesError } = await ctx.supabase
      .from("contract_files")
      .select("id", { count: "exact", head: true })
      .eq("contract_id", contractId)
      .is("deleted_at", null);

    if (filesError) {
      throw new Error(filesError.message);
    }

    const status = row.status;
    const days_remaining = computeDaysRemaining(row.end_date);

    const [renewedFrom, renewedTo] = await Promise.all([
      row.renewed_from_id
        ? ctx.supabase
            .from("contracts")
            .select("id, contract_number")
            .eq("id", row.renewed_from_id)
            .is("deleted_at", null)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      row.renewed_to_id
        ? ctx.supabase
            .from("contracts")
            .select("id, contract_number")
            .eq("id", row.renewed_to_id)
            .is("deleted_at", null)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return {
      id: row.id,
      contract_number: row.contract_number,
      customer_id: row.customers.id,
      customer_name: row.customers.name,
      branch_id: row.branch_id,
      branch_name: row.branches.name,
      branch_code: row.branches.code,
      contract_type: row.contract_type,
      start_date: row.start_date,
      end_date: row.end_date,
      status,
      renewal_badge: computeContractRenewalBadge(status, row.end_date),
      days_remaining,
      annual_maintenance_count: row.annual_maintenance_count ?? 0,
      total_maintenance_count: row.total_maintenance_count ?? 0,
      completed_maintenance_count: row.completed_maintenance_count ?? 0,
      sla_response_hours: row.sla_response_hours ?? 48,
      parts_included: row.parts_included ?? true,
      travel_included: row.travel_included ?? true,
      working_hours: row.working_hours ?? "business",
      list_price: row.list_price,
      minimum_price: row.minimum_price,
      agreed_price: row.agreed_price,
      currency: row.currency ?? "TRY",
      override_reason: row.override_reason,
      payment_method: row.payment_method ?? "annual_prepaid",
      vat_included: row.vat_included ?? true,
      vat_rate: row.vat_rate ?? 20,
      responsible_user_id: row.responsible_user_id,
      responsible_name: row.users?.full_name ?? "—",
      renewed_from: renewedFrom.data
        ? {
            id: renewedFrom.data.id,
            contract_number: renewedFrom.data.contract_number,
          }
        : null,
      renewed_to: renewedTo.data
        ? {
            id: renewedTo.data.id,
            contract_number: renewedTo.data.contract_number,
          }
        : null,
      special_terms: row.special_terms,
      notes: row.notes,
      devices,
      file_count: fileCount ?? 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (error) {
    if (error instanceof ContractApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

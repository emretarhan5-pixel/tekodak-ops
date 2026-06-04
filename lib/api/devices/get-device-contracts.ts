"use server";

import {
  assertCanAccessCustomerBranch,
  DeviceApiError,
  getDeviceApiContext,
  toActionError,
} from "@/lib/api/devices/auth";
import {
  computeContractRenewalBadge,
  computeDaysRemaining,
} from "@/lib/api/contracts/contract-badge";
import type { DeviceContractLink } from "@/lib/api/devices/types";
import type { ContractStatus } from "@/lib/constants/contract";

export async function getDeviceContracts(
  deviceId: string,
): Promise<DeviceContractLink[]> {
  try {
    const ctx = await getDeviceApiContext();

    const { data: device, error: deviceError } = await ctx.supabase
      .from("devices")
      .select(
        `
        id,
        customers!devices_customer_id_fkey!inner ( branch_id, deleted_at )
      `,
      )
      .eq("id", deviceId)
      .is("deleted_at", null)
      .maybeSingle();

    if (deviceError) {
      throw new Error(deviceError.message);
    }

    if (!device) {
      throw new DeviceApiError("Cihaz bulunamadı", "NOT_FOUND");
    }

    const row = device as typeof device & {
      customers: { branch_id: string; deleted_at: string | null };
    };

    if (row.customers.deleted_at) {
      throw new DeviceApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    assertCanAccessCustomerBranch(ctx, row.customers.branch_id);

    const { data, error } = await ctx.supabase
      .from("contract_devices")
      .select(
        `
        id,
        contract_id,
        contracts!inner (
          id,
          contract_number,
          start_date,
          end_date,
          status,
          deleted_at
        )
      `,
      )
      .eq("device_id", deviceId)
      .is("removed_at", null);

    if (error) {
      throw new Error(error.message);
    }

    const links: DeviceContractLink[] = [];

    for (const linkRow of data ?? []) {
      const typed = linkRow as typeof linkRow & {
        contracts: {
          id: string;
          contract_number: string;
          start_date: string;
          end_date: string;
          status: ContractStatus;
          deleted_at: string | null;
        };
      };
      if (typed.contracts.deleted_at) {
        continue;
      }
      const status = typed.contracts.status;
      const end_date = typed.contracts.end_date;
      links.push({
        link_id: typed.id,
        contract_id: typed.contracts.id,
        contract_number: typed.contracts.contract_number,
        start_date: typed.contracts.start_date,
        end_date,
        status,
        renewal_badge: computeContractRenewalBadge(status, end_date),
        days_remaining: computeDaysRemaining(end_date),
      });
    }

    links.sort((a, b) => b.end_date.localeCompare(a.end_date));

    return links;
  } catch (error) {
    if (error instanceof DeviceApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

"use server";

import { worstContractBadge } from "@/lib/api/customers/contract-status";
import {
  assertCanAccessBranch,
  CustomerApiError,
  getCustomerApiContext,
  toActionError,
} from "@/lib/api/customers/auth";
import type { CustomerDetail } from "@/lib/api/customers/types";
import type { CustomerType } from "@/lib/constants/customer";

export async function getCustomerById(
  customerId: string,
): Promise<CustomerDetail> {
  try {
    const ctx = await getCustomerApiContext();

    const { data: customer, error } = await ctx.supabase
      .from("customers")
      .select(
        `
        id,
        name,
        tax_office,
        tax_number,
        customer_type,
        sector,
        main_phone,
        email,
        website,
        city,
        district,
        full_address,
        notes,
        branch_id,
        created_at,
        updated_at,
        branches!inner ( name, code ),
        customer_contacts (
          id,
          customer_id,
          full_name,
          title,
          phone,
          email,
          is_primary,
          notes,
          created_at
        ),
        customer_responsible_users (
          id,
          user_id,
          is_primary,
          user:users!customer_responsible_users_user_id_fkey (
            full_name
          )
        ),
        customer_pins ( user_id ),
        contracts ( status, end_date )
      `,
      )
      .eq("id", customerId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!customer) {
      throw new CustomerApiError("Müşteri bulunamadı", "NOT_FOUND");
    }

    const row = customer as unknown as {
      id: string;
      name: string;
      tax_office: string | null;
      tax_number: string;
      customer_type: CustomerType;
      sector: string | null;
      main_phone: string;
      email: string | null;
      website: string | null;
      city: string;
      district: string | null;
      full_address: string | null;
      notes: string | null;
      branch_id: string;
      created_at: string;
      updated_at: string;
      branches: { name: string; code: string };
      customer_contacts: CustomerDetail["contacts"];
      customer_responsible_users: Array<{
        id: string;
        user_id: string;
        is_primary: boolean;
        user: { full_name: string } | null;
      }>;
      customer_pins: Array<{ user_id: string }>;
      contracts: Array<{ status: string; end_date: string }>;
    };

    assertCanAccessBranch(ctx, row.branch_id);

    const [
      devicesCount,
      contractsCount,
      openWoCount,
      completedWoCount,
    ] = await Promise.all([
      ctx.supabase
        .from("devices")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .eq("status", "active")
        .is("deleted_at", null),
      ctx.supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .in("status", ["active", "renewal_approaching", "expiring_soon"])
        .is("deleted_at", null),
      ctx.supabase
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .in("status", ["new", "assigned", "in_progress", "on_hold"])
        .is("deleted_at", null),
      ctx.supabase
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .eq("status", "completed")
        .is("deleted_at", null),
    ]);

    const activeContracts = (row.contracts ?? []).filter(
      (c) => !["cancelled", "renewed"].includes(c.status),
    );

    return {
      id: row.id,
      name: row.name,
      tax_office: row.tax_office,
      tax_number: row.tax_number,
      customer_type: row.customer_type,
      sector: row.sector,
      main_phone: row.main_phone,
      email: row.email,
      website: row.website,
      city: row.city,
      district: row.district,
      full_address: row.full_address,
      notes: row.notes,
      branch_id: row.branch_id,
      branch_name: row.branches.name,
      branch_code: row.branches.code,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_pinned: (row.customer_pins ?? []).some(
        (p) => p.user_id === ctx.user.id,
      ),
      contacts: row.customer_contacts ?? [],
      responsible_users: (row.customer_responsible_users ?? []).map((r) => ({
        id: r.id,
        user_id: r.user_id,
        full_name: r.user?.full_name ?? "—",
        is_primary: r.is_primary,
      })),
      contract_badge: worstContractBadge(activeContracts),
      stats: {
        active_devices: devicesCount.count ?? 0,
        active_contracts: contractsCount.count ?? 0,
        open_work_orders: openWoCount.count ?? 0,
        completed_work_orders: completedWoCount.count ?? 0,
      },
    };
  } catch (error) {
    if (error instanceof CustomerApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

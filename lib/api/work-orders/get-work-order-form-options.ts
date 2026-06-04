"use server";

import {
  getWorkOrderApiContext,
  resolveBranchFilter,
  toActionError,
  WorkOrderApiError,
} from "@/lib/api/work-orders/auth";

export type WorkOrderFormCustomerOption = {
  id: string;
  name: string;
};

export type WorkOrderFormAssigneeOption = {
  id: string;
  full_name: string;
};

export type WorkOrderFormOptions = {
  customers: WorkOrderFormCustomerOption[];
  assignees: WorkOrderFormAssigneeOption[];
};

export async function getWorkOrderFormOptions(): Promise<WorkOrderFormOptions> {
  try {
    const ctx = await getWorkOrderApiContext();
    const branchFilter = resolveBranchFilter(ctx);

    let customersQuery = ctx.supabase
      .from("customers")
      .select("id, name")
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(2000);

    if (branchFilter) {
      customersQuery = customersQuery.eq("branch_id", branchFilter);
    }

    let usersQuery = ctx.supabase
      .from("users")
      .select("id, full_name")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("full_name", { ascending: true });

    if (branchFilter) {
      usersQuery = usersQuery.eq("branch_id", branchFilter);
    }

    const [customersRes, usersRes] = await Promise.all([
      customersQuery,
      usersQuery,
    ]);

    if (customersRes.error) {
      throw new Error(customersRes.error.message);
    }
    if (usersRes.error) {
      throw new Error(usersRes.error.message);
    }

    return {
      customers: (customersRes.data ?? []) as WorkOrderFormCustomerOption[],
      assignees: (usersRes.data ?? []) as WorkOrderFormAssigneeOption[],
    };
  } catch (error) {
    if (error instanceof WorkOrderApiError) {
      throw error;
    }
    throw new Error(toActionError(error));
  }
}

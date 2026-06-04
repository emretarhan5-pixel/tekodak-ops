import type { AppSupabaseClient } from "@/lib/supabase/mutation-client";
import type { Json } from "@/lib/supabase/types";
import type { WorkOrderApiContext } from "@/lib/api/work-orders/auth";
import { WorkOrderApiError } from "@/lib/api/work-orders/auth";
import {
  WORK_ORDER_DEFAULT_SLA_HOURS,
  type WorkOrderActivityType,
  type WorkOrderPriority,
  type WorkOrderStatus,
} from "@/lib/constants/work-order";
import type { CreateWorkOrderInput } from "@/schemas/work-order";

export function emptyToNull(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  return value;
}

export function resolveInitialStatus(
  assignedTo: string | null,
): WorkOrderStatus {
  return assignedTo ? "assigned" : "new";
}

export function prioritySortRank(priority: WorkOrderPriority): number {
  const ranks: Record<WorkOrderPriority, number> = {
    urgent: 4,
    high: 3,
    normal: 2,
    low: 1,
  };
  return ranks[priority];
}

export function computeSlaDeadline(
  priority: WorkOrderPriority,
  contractSlaHours: number | null | undefined,
  from: Date = new Date(),
): string {
  const hours =
    contractSlaHours != null && contractSlaHours > 0
      ? contractSlaHours
      : WORK_ORDER_DEFAULT_SLA_HOURS[priority];
  return new Date(from.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function matchesDateRange(
  scheduledDate: string | null,
  dateFrom?: string,
  dateTo?: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  if (!scheduledDate) return false;
  if (dateFrom && scheduledDate < dateFrom) return false;
  if (dateTo && scheduledDate > dateTo) return false;
  return true;
}

export async function validateCustomer(
  ctx: WorkOrderApiContext,
  customerId: string,
): Promise<{ id: string; branch_id: string }> {
  const { data: customer, error } = await ctx.supabase
    .from("customers")
    .select("id, branch_id")
    .eq("id", customerId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!customer) {
    throw new WorkOrderApiError("Müşteri bulunamadı", "NOT_FOUND");
  }

  if (ctx.branchScope && customer.branch_id !== ctx.branchScope) {
    throw new WorkOrderApiError("Bu şube için yetkiniz yok", "FORBIDDEN");
  }

  return customer;
}

export async function validateDeviceForCustomer(
  ctx: WorkOrderApiContext,
  deviceId: string,
  customerId: string,
): Promise<void> {
  const { data: device, error } = await ctx.supabase
    .from("devices")
    .select("id, customer_id")
    .eq("id", deviceId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!device) {
    throw new WorkOrderApiError("Cihaz bulunamadı", "NOT_FOUND");
  }

  if (device.customer_id !== customerId) {
    throw new WorkOrderApiError(
      "Seçilen cihaz bu müşteriye ait değil",
      "FORBIDDEN",
    );
  }
}

export async function validateContractForCustomer(
  ctx: WorkOrderApiContext,
  contractId: string,
  customerId: string,
): Promise<{ sla_response_hours: number | null }> {
  const { data: contract, error } = await ctx.supabase
    .from("contracts")
    .select("id, customer_id, sla_response_hours")
    .eq("id", contractId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!contract) {
    throw new WorkOrderApiError("Sözleşme bulunamadı", "NOT_FOUND");
  }

  if (contract.customer_id !== customerId) {
    throw new WorkOrderApiError(
      "Seçilen sözleşme bu müşteriye ait değil",
      "FORBIDDEN",
    );
  }

  return { sla_response_hours: contract.sla_response_hours };
}

export async function validateAssignee(
  ctx: WorkOrderApiContext,
  userId: string,
): Promise<void> {
  const { data: assignee, error } = await ctx.supabase
    .from("users")
    .select("id, is_active, deleted_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!assignee?.is_active || assignee.deleted_at) {
    throw new WorkOrderApiError("Atanan personel bulunamadı", "NOT_FOUND");
  }
}

export async function validateWorkOrderRelations(
  ctx: WorkOrderApiContext,
  input: Pick<
    CreateWorkOrderInput,
    "customer_id" | "device_id" | "contract_id" | "assigned_to"
  >,
): Promise<{
  branchId: string;
  contractSlaHours: number | null;
}> {
  const customer = await validateCustomer(ctx, input.customer_id);

  if (input.device_id) {
    await validateDeviceForCustomer(ctx, input.device_id, input.customer_id);
  }

  let contractSlaHours: number | null = null;
  if (input.contract_id) {
    const contract = await validateContractForCustomer(
      ctx,
      input.contract_id,
      input.customer_id,
    );
    contractSlaHours = contract.sla_response_hours;
  }

  if (input.assigned_to) {
    await validateAssignee(ctx, input.assigned_to);
  }

  return { branchId: customer.branch_id, contractSlaHours };
}

export async function insertWorkOrderActivity(
  supabase: AppSupabaseClient,
  params: {
    workOrderId: string;
    userId: string;
    activityType: WorkOrderActivityType;
    description: string;
    oldValue?: Json | null;
    newValue?: Json | null;
  },
): Promise<void> {
  const { error } = await supabase.from("work_order_activities").insert({
    work_order_id: params.workOrderId,
    user_id: params.userId,
    activity_type: params.activityType,
    description: params.description,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

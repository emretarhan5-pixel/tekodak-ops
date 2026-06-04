import type { WorkOrderDetail } from "@/lib/api/work-orders/types";
import type { WorkOrderFormValues } from "@/schemas/work-order";

export function workOrderDetailToFormValues(
  workOrder: WorkOrderDetail,
): WorkOrderFormValues {
  return {
    customer_id: workOrder.customer_id,
    device_id: workOrder.device_id,
    contract_id: workOrder.contract_id,
    work_type: workOrder.work_type,
    priority: workOrder.priority,
    assigned_user_ids: workOrder.assigned_to ? [workOrder.assigned_to] : [],
    problem_description: workOrder.problem_description,
    scheduled_date: workOrder.scheduled_date,
    scheduled_time: workOrder.scheduled_time,
    service_location: workOrder.service_location,
    service_location_note: workOrder.service_location_note,
    internal_notes: workOrder.internal_notes,
  };
}

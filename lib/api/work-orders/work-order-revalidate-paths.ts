import { revalidatePath } from "next/cache";

export async function revalidateWorkOrderRelatedPaths(workOrder: {
  id: string;
  customer_id: string;
  device_id: string | null;
  contract_id: string | null;
}): Promise<void> {
  revalidatePath("/work-orders");
  revalidatePath(`/work-orders/${workOrder.id}`);
  revalidatePath(`/work-orders/${workOrder.id}/edit`);
  revalidatePath(`/customers/${workOrder.customer_id}`);
  if (workOrder.device_id) {
    revalidatePath(`/devices/${workOrder.device_id}`);
  }
  if (workOrder.contract_id) {
    revalidatePath(`/contracts/${workOrder.contract_id}`);
  }
}

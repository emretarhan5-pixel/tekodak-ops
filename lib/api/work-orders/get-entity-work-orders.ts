"use server";

import { getWorkOrders } from "@/lib/api/work-orders/get-work-orders";
import type { WorkOrderListItem } from "@/lib/api/work-orders/types";

const ENTITY_LIST_PAGE_SIZE = 100;

export async function getCustomerWorkOrders(
  customerId: string,
): Promise<WorkOrderListItem[]> {
  const result = await getWorkOrders({
    customerId,
    page: 1,
    pageSize: ENTITY_LIST_PAGE_SIZE,
  });
  return result.data;
}

export async function getDeviceWorkOrders(
  deviceId: string,
): Promise<WorkOrderListItem[]> {
  const result = await getWorkOrders({
    deviceId,
    page: 1,
    pageSize: ENTITY_LIST_PAGE_SIZE,
  });
  return result.data;
}

export async function getContractWorkOrders(
  contractId: string,
): Promise<WorkOrderListItem[]> {
  const result = await getWorkOrders({
    contractId,
    page: 1,
    pageSize: ENTITY_LIST_PAGE_SIZE,
  });
  return result.data;
}

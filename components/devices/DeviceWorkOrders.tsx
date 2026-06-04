import { WorkOrderHistoryTable } from "@/components/work-orders/WorkOrderHistoryTable";
import type { WorkOrderListItem } from "@/lib/api/work-orders/types";

type DeviceWorkOrdersProps = {
  deviceId: string;
  customerId: string;
  workOrders: WorkOrderListItem[];
  canEdit: boolean;
};

export function DeviceWorkOrders({
  deviceId,
  customerId,
  workOrders,
  canEdit,
}: DeviceWorkOrdersProps) {
  return (
    <WorkOrderHistoryTable
      title="İş geçmişi"
      description="Bu cihaza bağlı iş emirleri"
      workOrders={workOrders}
      emptyTitle="İş emri bulunamadı"
      emptyDescription="Bu cihaz için henüz iş emri kaydı yok."
      newWorkOrderHref={`/work-orders/new?customer=${customerId}`}
      canEdit={canEdit}
    />
  );
}

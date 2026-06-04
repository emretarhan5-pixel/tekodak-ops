import { WorkOrderHistoryTable } from "@/components/work-orders/WorkOrderHistoryTable";
import type { WorkOrderListItem } from "@/lib/api/work-orders/types";

type CustomerWorkOrdersProps = {
  customerId: string;
  workOrders: WorkOrderListItem[];
  canEdit: boolean;
};

export function CustomerWorkOrders({
  customerId,
  workOrders,
  canEdit,
}: CustomerWorkOrdersProps) {
  return (
    <WorkOrderHistoryTable
      title="İş geçmişi"
      description="Bu müşteriye ait iş emirleri"
      workOrders={workOrders}
      emptyTitle="İş emri bulunamadı"
      emptyDescription="Bu müşteri için henüz iş emri kaydı yok."
      newWorkOrderHref={`/work-orders/new?customer=${customerId}`}
      showDevice
      canEdit={canEdit}
    />
  );
}

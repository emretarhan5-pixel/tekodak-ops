import { WorkOrderHistoryTable } from "@/components/work-orders/WorkOrderHistoryTable";
import type { WorkOrderListItem } from "@/lib/api/work-orders/types";

type ContractWorkOrdersProps = {
  customerId: string;
  workOrders: WorkOrderListItem[];
  canEdit: boolean;
};

export function ContractWorkOrders({
  customerId,
  workOrders,
  canEdit,
}: ContractWorkOrdersProps) {
  return (
    <WorkOrderHistoryTable
      title="İş geçmişi"
      description="Bu sözleşmeye bağlı iş emirleri"
      workOrders={workOrders}
      emptyTitle="İş emri bulunamadı"
      emptyDescription="Bu sözleşme için henüz iş emri kaydı yok."
      newWorkOrderHref={`/work-orders/new?customer=${customerId}`}
      showDevice
      canEdit={canEdit}
    />
  );
}

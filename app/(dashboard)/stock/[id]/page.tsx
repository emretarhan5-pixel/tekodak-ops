import { notFound } from "next/navigation";

import { StockItemDetail } from "@/components/stock/StockItemDetail";
import { StockApiError } from "@/lib/api/stock/auth";
import { deleteStockItem } from "@/lib/api/stock/delete-stock-item";
import { getStockItemById } from "@/lib/api/stock/get-stock-item-by-id";
import { getStockItemDeletionImpact } from "@/lib/api/stock/get-stock-item-deletion-impact";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";

type StockDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickString(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function StockDetailPage({
  params,
  searchParams,
}: StockDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const branchId = pickString(resolvedSearchParams, "branchId");
  const movement = pickString(resolvedSearchParams, "movement");

  try {
    const user = await getDashboardUser();

    if (!user) {
      notFound();
    }

    const permissions = getPermissions(user);
    const item = await getStockItemById(id, branchId);

    return (
      <StockItemDetail
        item={item}
        canEdit={permissions.canEdit}
        initialTab={movement === "new" ? "movements" : "general"}
        openMovementOnMount={movement === "new" && permissions.canEdit}
        deleteStockItemAction={deleteStockItem}
        getDeletionImpactAction={getStockItemDeletionImpact}
      />
    );
  } catch (error) {
    if (error instanceof StockApiError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

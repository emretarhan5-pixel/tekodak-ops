import { WorkOrdersPageContent } from "@/components/work-orders/work-orders-page-content";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getWorkOrderFilterOptions } from "@/lib/api/work-orders/get-work-order-filter-options";
import { getWorkOrders } from "@/lib/api/work-orders/get-work-orders";
import { parseWorkOrderSearchParams } from "@/lib/api/work-orders/parse-work-order-search-params";
import { getPermissions } from "@/lib/utils/permissions";

type WorkOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(
  params: Record<string, string | string[] | undefined>,
): boolean {
  const keys = [
    "search",
    "branchId",
    "customerId",
    "deviceId",
    "status",
    "workType",
    "priority",
    "assignedTo",
    "dateFrom",
    "dateTo",
  ] as const;
  return keys.some((key) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0;
  });
}

export default async function WorkOrdersPage({
  searchParams,
}: WorkOrdersPageProps) {
  const resolvedParams = await searchParams;
  const filters = parseWorkOrderSearchParams(resolvedParams);

  const user = await getDashboardUser();
  const permissions = getPermissions(user);

  try {
    const [result, filterOptions] = await Promise.all([
      getWorkOrders(filters),
      getWorkOrderFilterOptions(),
    ]);

    return (
      <WorkOrdersPageContent
        result={result}
        filterOptions={filterOptions}
        filters={filters}
        showBranchFilter={permissions.isAdmin}
        staffBranchLabel={
          user?.branch_id
            ? filterOptions.branches.find((b) => b.id === user.branch_id)?.name
            : undefined
        }
        hasActiveFilters={hasActiveFilters(resolvedParams)}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "İş emri listesi yüklenirken bir hata oluştu.";

    return (
      <Card className="border-destructive/40">
        <CardContent className="py-10 text-center">
          <h1 className="text-lg font-semibold text-destructive">
            Liste yüklenemedi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }
}

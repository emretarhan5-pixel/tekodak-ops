import { StockPageContent } from "@/components/stock/stock-page-content";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getStockFilterOptions } from "@/lib/api/stock/get-stock-filter-options";
import { getStockItems } from "@/lib/api/stock/get-stock-items";
import { getStockListSummary } from "@/lib/api/stock/get-stock-list-summary";
import { parseStockSearchParams } from "@/lib/api/stock/parse-stock-search-params";
import { getPermissions } from "@/lib/utils/permissions";

type StockPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(
  params: Record<string, string | string[] | undefined>,
): boolean {
  const keys = ["search", "branchId", "category", "status"] as const;
  return keys.some((key) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0;
  });
}

export default async function StockPage({ searchParams }: StockPageProps) {
  const resolvedParams = await searchParams;
  const filters = parseStockSearchParams(resolvedParams);

  const user = await getDashboardUser();
  const permissions = getPermissions(user);

  try {
    const [result, filterOptions, summary] = await Promise.all([
      getStockItems(filters),
      getStockFilterOptions(),
      getStockListSummary(filters.branchId),
    ]);

    return (
      <StockPageContent
        result={result}
        summary={summary}
        filterOptions={filterOptions}
        filters={filters}
        showBranchFilter={permissions.isAdmin}
        staffBranchLabel={
          user?.branch_id
            ? filterOptions.branches.find((b) => b.id === user.branch_id)?.name
            : undefined
        }
        hasActiveFilters={hasActiveFilters(resolvedParams)}
        canEdit={permissions.canEdit}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Stok listesi yüklenirken bir hata oluştu.";

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

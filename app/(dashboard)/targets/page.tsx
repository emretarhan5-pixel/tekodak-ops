import { TargetsPageContent } from "@/components/targets/targets-page-content";
import { Card, CardContent } from "@/components/ui/card";
import { getTargetFilterOptions } from "@/lib/api/targets/get-target-filter-options";
import { getTargetListSummary } from "@/lib/api/targets/get-target-list-summary";
import { getTargets } from "@/lib/api/targets/get-targets";
import { parseTargetSearchParams } from "@/lib/api/targets/parse-target-search-params";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";

type TargetsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(
  params: Record<string, string | string[] | undefined>,
): boolean {
  const keys = [
    "search",
    "branchId",
    "metricType",
    "periodType",
    "status",
  ] as const;

  return keys.some((key) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0;
  });
}

export default async function TargetsPage({ searchParams }: TargetsPageProps) {
  const resolvedParams = await searchParams;
  const filters = parseTargetSearchParams(resolvedParams);

  const user = await getDashboardUser();
  const permissions = getPermissions(user);

  try {
    const [result, filterOptions, summary] = await Promise.all([
      getTargets(filters),
      getTargetFilterOptions(),
      getTargetListSummary(filters.branchId),
    ]);

    return (
      <TargetsPageContent
        result={result}
        summary={summary}
        filterOptions={filterOptions}
        filters={filters}
        showBranchFilter={permissions.isAdmin}
        staffBranchLabel={
          user?.branch_id
            ? filterOptions.branches.find((branch) => branch.id === user.branch_id)
                ?.name
            : undefined
        }
        hasActiveFilters={hasActiveFilters(resolvedParams)}
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Hedef listesi yüklenirken bir hata oluştu.";

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

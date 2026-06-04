import { ContractsPageContent } from "@/components/contracts/contracts-page-content";
import { Card, CardContent } from "@/components/ui/card";
import { getContractFilterOptions } from "@/lib/api/contracts/get-contract-filter-options";
import { getContracts } from "@/lib/api/contracts/get-contracts";
import { parseContractSearchParams } from "@/lib/api/contracts/parse-contract-search-params";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";

type ContractsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(
  params: Record<string, string | string[] | undefined>,
): boolean {
  const keys = [
    "search",
    "branchId",
    "customerId",
    "listFilter",
    "status",
    "renewalBadge",
    "dateFrom",
    "dateTo",
  ] as const;
  return keys.some((key) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0;
  });
}

export default async function ContractsPage({
  searchParams,
}: ContractsPageProps) {
  const resolvedParams = await searchParams;
  const filters = parseContractSearchParams(resolvedParams);

  const user = await getDashboardUser();
  const permissions = getPermissions(user);

  try {
    const [result, filterOptions] = await Promise.all([
      getContracts(filters),
      getContractFilterOptions(),
    ]);

    return (
      <ContractsPageContent
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
        : "Sözleşme listesi yüklenirken bir hata oluştu.";

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

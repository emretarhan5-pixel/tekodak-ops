import { CustomersPageContent } from "@/components/customers/customers-page-content";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getCustomerFilterOptions } from "@/lib/api/customers/get-customer-filter-options";
import { getCustomers } from "@/lib/api/customers/get-customers";
import { parseCustomerSearchParams } from "@/lib/api/customers/parse-customer-search-params";
import { getPermissions } from "@/lib/utils/permissions";

type CustomersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(
  params: Record<string, string | string[] | undefined>,
): boolean {
  const keys = [
    "search",
    "branchId",
    "sector",
    "customerType",
    "contractStatus",
  ] as const;
  return keys.some((key) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0;
  });
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const resolvedParams = await searchParams;
  const filters = parseCustomerSearchParams(resolvedParams);

  const user = await getDashboardUser();
  const permissions = getPermissions(user);

  try {
    const [result, filterOptions] = await Promise.all([
      getCustomers(filters),
      getCustomerFilterOptions(),
    ]);

    return (
      <CustomersPageContent
        result={result}
        filterOptions={filterOptions}
        exportFilters={filters}
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
        : "Müşteri listesi yüklenirken bir hata oluştu.";

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

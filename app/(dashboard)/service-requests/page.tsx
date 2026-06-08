import { ServiceRequestsPageContent } from "@/components/service-requests/service-requests-page-content";
import { ServiceRequestsPageShell } from "@/components/service-requests/service-requests-page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { getServiceRequestFilterOptions } from "@/lib/api/service-requests/get-service-request-filter-options";
import { getServiceRequests } from "@/lib/api/service-requests/get-service-requests";
import { parseServiceRequestSearchParams } from "@/lib/api/service-requests/parse-service-request-search-params";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";

type ServiceRequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(
  params: Record<string, string | string[] | undefined>,
): boolean {
  const keys = [
    "search",
    "branchId",
    "status",
    "assignedTechnicianId",
    "dateFrom",
    "dateTo",
  ] as const;

  return keys.some((key) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0;
  });
}

export default async function ServiceRequestsPage({
  searchParams,
}: ServiceRequestsPageProps) {
  const resolvedParams = await searchParams;
  const filters = parseServiceRequestSearchParams(resolvedParams);

  const user = await getDashboardUser();
  const permissions = getPermissions(user);

  try {
    const [result, filterOptions] = await Promise.all([
      getServiceRequests(filters),
      getServiceRequestFilterOptions(),
    ]);

    const content = (
      <ServiceRequestsPageContent
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

    if (user?.role === "staff") {
      return <ServiceRequestsPageShell>{content}</ServiceRequestsPageShell>;
    }

    return content;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Servis talebi listesi yüklenirken bir hata oluştu.";

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

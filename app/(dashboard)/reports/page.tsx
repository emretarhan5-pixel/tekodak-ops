import { ReportsPage } from "@/components/reports/ReportsPage";
import { Card, CardContent } from "@/components/ui/card";
import { getReportFilterOptions } from "@/lib/api/reports/get-report-filter-options";
import { getReportPageData } from "@/lib/api/reports/get-report-page-data";
import { parseReportSearchParams } from "@/lib/api/reports/parse-report-search-params";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getPermissions } from "@/lib/utils/permissions";

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsRoutePage({
  searchParams,
}: ReportsPageProps) {
  const resolvedParams = await searchParams;
  const filters = parseReportSearchParams(resolvedParams);

  const user = await getDashboardUser();
  const permissions = getPermissions(user);

  try {
    const [reportData, filterOptions] = await Promise.all([
      getReportPageData(filters),
      getReportFilterOptions(),
    ]);

    return (
      <ReportsPage
        reportData={reportData}
        filterOptions={filterOptions}
        filters={filters}
        showBranchFilter={permissions.isAdmin}
        staffBranchLabel={
          user?.branch_id
            ? filterOptions.branches.find((branch) => branch.id === user.branch_id)
                ?.name
            : undefined
        }
      />
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Raporlar yüklenirken bir hata oluştu.";

    return (
      <Card className="border-destructive/40">
        <CardContent className="py-10 text-center">
          <h1 className="text-lg font-semibold text-destructive">
            Raporlar yüklenemedi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }
}

import { DevicesPageContent } from "@/components/devices/devices-page-content";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";
import { getDeviceFilterOptions } from "@/lib/api/devices/get-device-filter-options";
import { getDevices } from "@/lib/api/devices/get-devices";
import { parseDeviceSearchParams } from "@/lib/api/devices/parse-device-search-params";
import { getPermissions } from "@/lib/utils/permissions";

type DevicesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(
  params: Record<string, string | string[] | undefined>,
): boolean {
  const keys = [
    "search",
    "branchId",
    "brandId",
    "customerId",
    "warrantyStatus",
    "showScrapped",
  ] as const;
  return keys.some((key) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0;
  });
}

export default async function DevicesPage({ searchParams }: DevicesPageProps) {
  const resolvedParams = await searchParams;
  const filters = parseDeviceSearchParams(resolvedParams);

  const user = await getDashboardUser();
  const permissions = getPermissions(user);

  try {
    const [result, filterOptions] = await Promise.all([
      getDevices(filters),
      getDeviceFilterOptions(),
    ]);

    return (
      <DevicesPageContent
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
        : "Cihaz listesi yüklenirken bir hata oluştu.";

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

import { redirect } from "next/navigation";

import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardData } from "@/lib/api/dashboard/get-dashboard-data";
import { DashboardApiError } from "@/lib/api/dashboard/auth";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";

export default async function DashboardPage() {
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const data = await getDashboardData();
    return <DashboardContent data={data} />;
  } catch (error) {
    const message =
      error instanceof DashboardApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Dashboard yüklenirken bir hata oluştu.";

    return (
      <Card className="border-destructive/40">
        <CardContent className="py-10 text-center">
          <h1 className="text-lg font-semibold text-destructive">
            Dashboard yüklenemedi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }
}

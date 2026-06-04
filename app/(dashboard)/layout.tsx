import { redirect } from "next/navigation";
import { Toaster } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardUserProvider } from "@/components/providers/dashboard-user-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { getUnreadCount } from "@/lib/api/notifications/get-unread-count";
import { getDashboardUser } from "@/lib/auth/get-dashboard-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getDashboardUser();

  if (!user) {
    redirect("/login");
  }

  let initialUnreadCount = 0;
  try {
    initialUnreadCount = await getUnreadCount();
  } catch {
    initialUnreadCount = 0;
  }

  return (
    <QueryProvider>
      <DashboardUserProvider user={user}>
        <DashboardShell initialUnreadCount={initialUnreadCount}>
          {children}
        </DashboardShell>
        <Toaster richColors position="top-center" closeButton />
      </DashboardUserProvider>
    </QueryProvider>
  );
}

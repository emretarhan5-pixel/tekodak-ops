import { NextResponse } from "next/server";

import {
  isCronAuthorized,
  unauthorizedCronResponse,
} from "@/lib/api/cron/auth";
import { runCriticalStockNotifications } from "@/lib/api/cron/critical-stock-notifications";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const result = await runCriticalStockNotifications();
    console.info("[cron:critical-stock]", result);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cron işi başarısız oldu";
    console.error("[cron:critical-stock]", message);
    return NextResponse.json(
      { error: message, job: "critical-stock" },
      { status: 500 },
    );
  }
}

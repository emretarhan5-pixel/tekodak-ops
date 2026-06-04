import { NextResponse } from "next/server";

import {
  isCronAuthorized,
  unauthorizedCronResponse,
} from "@/lib/api/cron/auth";
import { runContractRenewalNotifications } from "@/lib/api/cron/contract-renewal-notifications";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const result = await runContractRenewalNotifications();
    console.info("[cron:contract-renewals]", result);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cron işi başarısız oldu";
    console.error("[cron:contract-renewals]", message);
    return NextResponse.json(
      { error: message, job: "contract-renewals" },
      { status: 500 },
    );
  }
}

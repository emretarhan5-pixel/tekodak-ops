import { NextResponse } from "next/server";

import {
  isCronAuthorized,
  unauthorizedCronResponse,
} from "@/lib/api/cron/auth";
import { runGoalProgressNotifications } from "@/lib/api/cron/goal-progress-notifications";

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return unauthorizedCronResponse();
  }

  try {
    const result = await runGoalProgressNotifications();
    console.info("[cron:goal-progress]", result);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Cron işi başarısız oldu";
    console.error("[cron:goal-progress]", message);
    return NextResponse.json(
      { error: message, job: "goal-progress" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

export function isCronAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export function unauthorizedCronResponse() {
  return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
}

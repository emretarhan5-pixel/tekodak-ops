import { type NextRequest, NextResponse } from "next/server";

import {
  fetchAppUser,
  isAppUserActive,
  updateSession,
} from "@/lib/supabase/middleware";

const AUTH_ROUTES = ["/login", "/forgot-password", "/reset-password"] as const;

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/customers",
  "/devices",
  "/contracts",
  "/work-orders",
  "/stock",
  "/targets",
  "/reports",
  "/settings",
  "/profile",
  "/notifications",
] as const;

function isAuthRoute(pathname: string): boolean {
  return (
    AUTH_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    ) || pathname.startsWith("/invite")
  );
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAdminOnlyRoute(pathname: string): boolean {
  return pathname === "/settings" || pathname.startsWith("/settings/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  const { supabase, response, user } = await updateSession(request);

  if (pathname === "/") {
    const redirectTo = user ? "/dashboard" : "/login";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  if (user && isAuthRoute(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isProtectedRoute(pathname)) {
    const appUser = await fetchAppUser(supabase, user.id);

    if (!isAppUserActive(appUser)) {
      await supabase.auth.signOut();
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "inactive");
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminOnlyRoute(pathname) && appUser?.role !== "admin") {
      return NextResponse.redirect(
        new URL("/dashboard?error=forbidden", request.url),
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

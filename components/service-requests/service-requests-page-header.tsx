"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { OnboardingRestartButton } from "@/components/onboarding/OnboardingRestartButton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ServiceRequestsPageHeader() {
  return (
    <div className="group relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Servis Talepleri</h1>
        <p className="mt-1 text-muted-foreground">
          Müşteri cihaz kaydı, arıza tespiti ve teklif süreci
        </p>
      </div>
      <div className="flex flex-col items-stretch gap-1 sm:items-end">
        <Link
          href="/service-requests/new"
          data-onboarding-target="sr-tour-new-button"
          className={cn(buttonVariants(), "gap-2")}
        >
          <Plus className="size-4" />
          Yeni Servis Talebi
        </Link>
        <OnboardingRestartButton />
      </div>
    </div>
  );
}

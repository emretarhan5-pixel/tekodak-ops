"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

import { ServiceRequestStatusBadge } from "@/components/service-requests/service-request-status-badge";
import { buttonVariants } from "@/components/ui/button";
import type { ServiceRequestListItem } from "@/lib/api/service-requests/types";
import { SERVICE_REQUEST_STEP_LABELS } from "@/lib/constants/service-request";
import { cn } from "@/lib/utils";

function formatCreatedDate(date: string): string {
  try {
    return format(parseISO(date), "d MMM yyyy", { locale: tr });
  } catch {
    return date;
  }
}

export function ServiceRequestCard({
  serviceRequest,
}: {
  serviceRequest: ServiceRequestListItem;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold sm:text-base">
            {serviceRequest.request_number}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {SERVICE_REQUEST_STEP_LABELS[serviceRequest.current_step]} ·{" "}
            <time dateTime={serviceRequest.created_at} suppressHydrationWarning>
              {formatCreatedDate(serviceRequest.created_at)}
            </time>
          </p>
        </div>
        <ServiceRequestStatusBadge
          status={serviceRequest.status}
          variant={serviceRequest.status_variant}
        />
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Firma</dt>
          <dd className="max-w-[58%] break-words text-right font-medium">
            {serviceRequest.company_name}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">İletişim</dt>
          <dd className="text-right">{serviceRequest.contact_name}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Cihaz</dt>
          <dd className="max-w-[58%] break-words text-right text-muted-foreground">
            {serviceRequest.brand_model}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Teknisyen</dt>
          <dd>{serviceRequest.technician_name}</dd>
        </div>
        {serviceRequest.under_warranty ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Garanti</dt>
            <dd className="text-emerald-700 dark:text-emerald-400">Evet</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4">
        <Link
          href={`/service-requests/${serviceRequest.id}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-11 min-h-11 w-full",
          )}
        >
          Devam Et →
        </Link>
      </div>
    </article>
  );
}

export function ServiceRequestCardList({
  serviceRequests,
}: {
  serviceRequests: ServiceRequestListItem[];
}) {
  if (serviceRequests.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {serviceRequests.map((item) => (
        <ServiceRequestCard key={item.id} serviceRequest={item} />
      ))}
    </div>
  );
}

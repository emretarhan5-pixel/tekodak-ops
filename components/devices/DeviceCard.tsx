"use client";

import Link from "next/link";

import { WarrantyStatusBadge } from "@/components/devices/warranty-status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { DeviceListItem } from "@/lib/api/devices/types";
import { DEVICE_STATUS_LABELS } from "@/lib/constants/device";
import { cn } from "@/lib/utils";

export function DeviceCard({ device }: { device: DeviceListItem }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono font-semibold">{device.serial_number}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {device.brand_name} · {device.model_name}
          </p>
        </div>
        {device.is_pinned ? (
          <Badge variant="secondary" className="text-[10px]">
            Sabitli
          </Badge>
        ) : null}
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Müşteri</dt>
          <dd>
            <Link
              href={`/customers/${device.customer_id}`}
              className="text-primary underline-offset-4 hover:underline"
            >
              {device.customer_name}
            </Link>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Şube</dt>
          <dd>
            {device.branch_name}{" "}
            <span className="text-muted-foreground">({device.branch_code})</span>
          </dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-muted-foreground">Garanti Durumu</dt>
          <dd>
            <WarrantyStatusBadge badge={device.warranty_badge} />
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Durum</dt>
          <dd>{DEVICE_STATUS_LABELS[device.status]}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <Link
          href={`/devices/${device.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
        >
          Detay
        </Link>
      </div>
    </article>
  );
}

export function DeviceCardList({ devices }: { devices: DeviceListItem[] }) {
  if (devices.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {devices.map((d) => (
        <DeviceCard key={d.id} device={d} />
      ))}
    </div>
  );
}

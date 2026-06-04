"use client";

import Link from "next/link";
import { Plus, Printer } from "lucide-react";

import { WarrantyStatusBadge } from "@/components/devices/warranty-status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CustomerDeviceItem } from "@/lib/api/devices/types";
import { DEVICE_STATUS_LABELS } from "@/lib/constants/device";
import { cn } from "@/lib/utils";

type CustomerDevicesProps = {
  customerId: string;
  devices: CustomerDeviceItem[];
  canEdit: boolean;
};

export function CustomerDevices({
  customerId,
  devices,
  canEdit,
}: CustomerDevicesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Cihazlar</CardTitle>
          <CardDescription>
            Bu müşteriye kayıtlı cihazlar
          </CardDescription>
        </div>
        {canEdit ? (
          <Link
            href={`/devices/new?customer=${customerId}`}
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <Plus className="size-4" />
            Cihaz Ekle
          </Link>
        ) : null}
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
            <Printer className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Bu müşteriye ait cihaz yok
            </p>
            {canEdit ? (
              <Link
                href={`/devices/new?customer=${customerId}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <Plus className="size-4" />
                İlk cihazı ekle
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seri no</TableHead>
                  <TableHead>Marka / model</TableHead>
                  <TableHead>Garanti</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id} className="cursor-pointer">
                    <TableCell>
                      <Link
                        href={`/devices/${device.id}`}
                        className="font-mono font-medium text-primary hover:underline"
                      >
                        {device.serial_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/devices/${device.id}`}
                        className="hover:underline"
                      >
                        {device.brand_name} · {device.model_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <WarrantyStatusBadge badge={device.warranty_badge} />
                    </TableCell>
                    <TableCell>
                      {DEVICE_STATUS_LABELS[device.status]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

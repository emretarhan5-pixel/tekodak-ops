"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { FileText } from "lucide-react";
import Link from "next/link";

import { ContractRenewalBadgeDisplay } from "@/components/contracts/contract-renewal-badge";
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
import type { DeviceContractLink } from "@/lib/api/devices/types";

type DeviceContractsProps = {
  contracts: DeviceContractLink[];
};

function formatDateRange(start: string, end: string): string {
  try {
    const s = format(parseISO(start), "d MMM yyyy", { locale: tr });
    const e = format(parseISO(end), "d MMM yyyy", { locale: tr });
    return `${s} – ${e}`;
  } catch {
    return `${start} – ${end}`;
  }
}

function formatDaysRemaining(days: number): string {
  if (days < 0) {
    return `${Math.abs(days)} gün geçti`;
  }
  if (days === 0) {
    return "Bugün bitiyor";
  }
  return `${days} gün kaldı`;
}

export function DeviceContracts({ contracts }: DeviceContractsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bakım sözleşmeleri</CardTitle>
        <CardDescription>
          Bu cihazın dahil olduğu sözleşmeler (contract_devices)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
            <FileText className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Bu cihaz aktif bir sözleşme kapsamında değil
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sözleşme no</TableHead>
                  <TableHead>Tarih aralığı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Kalan gün</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((link) => (
                  <TableRow key={link.link_id}>
                    <TableCell>
                      <Link
                        href={`/contracts/${link.contract_id}`}
                        className="font-mono font-medium text-primary hover:underline"
                      >
                        {link.contract_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateRange(link.start_date, link.end_date)}
                    </TableCell>
                    <TableCell>
                      <ContractRenewalBadgeDisplay
                        renewalBadge={link.renewal_badge}
                        status={link.status}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDaysRemaining(link.days_remaining)}
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

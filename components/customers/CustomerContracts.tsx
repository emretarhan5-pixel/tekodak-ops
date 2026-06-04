"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

import { ContractRenewalBadgeDisplay } from "@/components/contracts/contract-renewal-badge";
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
import type { CustomerContractListItem } from "@/lib/api/contracts/types";
import { formatContractPrice } from "@/lib/utils/format-contract-price";
import { cn } from "@/lib/utils";

type CustomerContractsProps = {
  customerId: string;
  contracts: CustomerContractListItem[];
  canEdit: boolean;
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

export function CustomerContracts({
  customerId,
  contracts,
  canEdit,
}: CustomerContractsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Sözleşmeler</CardTitle>
          <CardDescription>Bu müşteriye ait bakım sözleşmeleri</CardDescription>
        </div>
        {canEdit ? (
          <Link
            href={`/contracts/new?customer=${customerId}`}
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <Plus className="size-4" />
            Yeni Sözleşme
          </Link>
        ) : null}
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-center">
            <FileText className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Bu müşteriye ait sözleşme yok
            </p>
            {canEdit ? (
              <Link
                href={`/contracts/new?customer=${customerId}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1.5",
                )}
              >
                <Plus className="size-4" />
                İlk sözleşmeyi ekle
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sözleşme no</TableHead>
                  <TableHead>Tarih aralığı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="text-right">Kalan gün</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="font-mono font-medium text-primary hover:underline"
                      >
                        {contract.contract_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateRange(contract.start_date, contract.end_date)}
                    </TableCell>
                    <TableCell>
                      <ContractRenewalBadgeDisplay
                        renewalBadge={contract.renewal_badge}
                        status={contract.status}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatContractPrice(
                        contract.agreed_price,
                        contract.currency,
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDaysRemaining(contract.days_remaining)}
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

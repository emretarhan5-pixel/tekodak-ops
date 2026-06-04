"use client";

import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

import { ContractRenewalBadgeDisplay } from "@/components/contracts/contract-renewal-badge";
import { buttonVariants } from "@/components/ui/button";
import type { ContractListItem } from "@/lib/api/contracts/types";
import { formatContractPrice } from "@/lib/utils/format-contract-price";
import { cn } from "@/lib/utils";

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

export function ContractCard({ contract }: { contract: ContractListItem }) {
  return (
    <Link
      href={`/contracts/${contract.id}`}
      className="block rounded-xl border border-border bg-card p-4 shadow-xs transition-colors hover:bg-muted/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono font-semibold">{contract.contract_number}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {contract.customer_name}
          </p>
        </div>
        <ContractRenewalBadgeDisplay
          renewalBadge={contract.renewal_badge}
          status={contract.status}
        />
      </div>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Süre</dt>
          <dd className="text-right">
            {formatDateRange(contract.start_date, contract.end_date)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Kalan gün</dt>
          <dd className="font-medium tabular-nums">
            {formatDaysRemaining(contract.days_remaining)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Tutar</dt>
          <dd className="font-medium tabular-nums">
            {formatContractPrice(contract.agreed_price, contract.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Şube</dt>
          <dd>
            {contract.branch_name}{" "}
            <span className="text-muted-foreground">
              ({contract.branch_code})
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none w-full",
          )}
        >
          Detay
        </span>
      </div>
    </Link>
  );
}

export function ContractCardList({
  contracts,
}: {
  contracts: ContractListItem[];
}) {
  if (contracts.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 md:hidden">
      {contracts.map((c) => (
        <ContractCard key={c.id} contract={c} />
      ))}
    </div>
  );
}

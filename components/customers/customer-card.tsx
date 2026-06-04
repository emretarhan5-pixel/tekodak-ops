"use client";

import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

import { ContractStatusBadge } from "@/components/customers/contract-status-badge";
import { CustomerRowActions } from "@/components/customers/customer-row-actions";
import { ResponsiblePersonCell } from "@/components/customers/responsible-person-cell";
import { Card, CardContent } from "@/components/ui/card";
import type { CustomerListItem } from "@/lib/api/customers/types";

type CustomerCardProps = {
  customer: CustomerListItem;
};

export function CustomerCard({ customer }: CustomerCardProps) {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer border-border/80 shadow-sm transition-colors hover:bg-muted/30"
      onClick={() => router.push(`/customers/${customer.id}`)}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {customer.is_pinned ? (
                <Star
                  className="size-4 shrink-0 fill-amber-400 text-amber-500"
                  aria-label="Sabitlenmiş"
                />
              ) : null}
              <span className="truncate font-semibold">{customer.name}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {customer.branch_name}
            </p>
          </div>
          <ContractStatusBadge status={customer.contract_badge} />
        </div>

        <ResponsiblePersonCell names={customer.responsible_names} />

        <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <CustomerRowActions
            customerId={customer.id}
            phone={customer.main_phone}
            email={customer.email}
          />
        </div>
      </CardContent>
    </Card>
  );
}

type CustomerCardListProps = {
  data: CustomerListItem[];
};

export function CustomerCardList({ data }: CustomerCardListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {data.map((customer) => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
}

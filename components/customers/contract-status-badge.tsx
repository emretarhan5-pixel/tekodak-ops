import { CONTRACT_BADGE_CONFIG } from "@/lib/constants/customer-contract-status";
import type { CustomerContractBadge } from "@/lib/api/customers/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ContractStatusBadge({
  status,
  className,
}: {
  status: CustomerContractBadge;
  className?: string;
}) {
  const config = CONTRACT_BADGE_CONFIG[status];

  return (
    <Badge className={cn(config.className, className)}>
      <span aria-hidden>{config.icon}</span>
      {config.label}
    </Badge>
  );
}

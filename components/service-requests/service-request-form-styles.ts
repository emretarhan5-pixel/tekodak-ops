import { cn } from "@/lib/utils";

export const textareaClassName = cn(
  "flex min-h-[100px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

export const selectClassName = cn(
  "flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70",
);

export function formatServiceRequestMoney(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

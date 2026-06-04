import type { ContractCurrency } from "@/lib/constants/contract";

export function formatContractPrice(
  amount: number,
  currency: ContractCurrency,
): string {
  const value = Number(amount);

  if (currency === "EUR") {
    return `${new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)} €`;
  }

  return `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} ₺`;
}
